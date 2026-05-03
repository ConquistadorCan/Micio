import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import env from "../config/index.js";
import { UnauthorizedError } from "../utils/errors.js";
import { ConversationService } from "../services/conversations.service.js";
import { MessageService } from "../services/message.service.js";
import { logger } from "../utils/logger.js";
import { prisma } from "../db/client.js";

const conversationService = new ConversationService();
const messageService = new MessageService();

const io = new Server({
    cors: {
        origin: env.CLIENT_URL,
        credentials: true
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
        logger.warn({ reason: message }, "Socket auth failed");
        next(new UnauthorizedError(message));
    }
})

io.on("connection", async (socket) => {
    const user = socket.data.userJwtPayload;
    logger.debug({ userId: user.id, socketId: socket.id }, "Socket connected");

    socket.join(`user:${user.id}`);

    const conversations = await conversationService.getConversationsForUser(user.id);

    conversations.forEach(conversation => {
        socket.join(conversation.id);
    });

    socket.on("disconnect", () => {
        logger.debug({ userId: user.id, socketId: socket.id }, "Socket disconnected");
    });

    socket.on("conversation:join", (conversationId: string) => {
        socket.join(conversationId);
        logger.debug({ userId: user.id, conversationId }, "Socket joined conversation room");
    });

    socket.on("message:send", async (data, ack) => {
        try {
            const { conversationId, content } = data;

            const participant = await prisma.conversationParticipant.findFirst({
                where: { conversationId, userId: user.id }
            });
            if (!participant) {
                ack?.({ ok: false, message: "You are not a member of this conversation" });
                return;
            }

            const message = await messageService.sendMessage(user.id, conversationId, content);

            io.to(conversationId).emit("message:new", message);
            ack?.({ ok: true, messageId: message.id });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not send message";
            logger.warn({ err, userId: user.id, conversationId: data?.conversationId }, "Message send failed");
            ack?.({ ok: false, message });
        }
    });

    socket.on("connect_error", (err) => logger.warn({ err: err.message }, "Socket connection error"));
})

export default io;
