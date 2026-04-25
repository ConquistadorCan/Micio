import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import env from "../config/index.js";
import { UnauthorizedError } from "../utils/errors.js";
import { ConversationService } from "../services/conversations.service.js";
import { MessageService } from "../services/message.service.js";
import { logger } from "../utils/logger.js";

const conversationService = new ConversationService();
const messageService = new MessageService();

const io = new Server({
    cors: {
        origin: env.CLIENT_URL
    }
});

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
    
        const decoded = jwt.verify(token, env.JWT_SECRET);
        socket.data.userJwtPayload = decoded;
    
        next();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Invalid or missing token";
        next(new UnauthorizedError(message));
    }
})

io.on("connection", async (socket) => {
    logger.info(`User connected: ${socket.id}`);
    const user = socket.data.userJwtPayload;

    const conversations = await conversationService.getConversationsForUser(user.id);

    conversations.forEach(conversation => {
        socket.join(conversation.id);
    })

    socket.on("conversation:join", (conversationId: string) => {
        socket.join(conversationId);
    });

    socket.on("message:send", async (data) => {
        logger.info(`User ${user.id} is sending a message to conversation ${data.conversationId}`);
        const { conversationId, content } = data;
        const message = await messageService.sendMessage(user.id, conversationId, content);

        io.to(conversationId).emit("message:new", message);
    });

    socket.on("connect_error", (err) => console.log("Hata:", err.message));
})

export default io;