import { FastifyInstance } from "fastify";
import { ConversationService } from "../services/conversations.service.js";
import { MessageService } from "../services/message.service.js";
import { ConversationCreate } from "@micio/shared";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../utils/errors.js";
import { prisma } from "../db/client.js";

export async function conversationRoutes(fastify: FastifyInstance) {
    const conversationService = new ConversationService();
    const messageService = new MessageService();

    fastify.get("/conversations", async (request, reply): Promise<void> => {
        const userId = request.userJwtPayload?.id;
        if (!userId) throw new UnauthorizedError();
        const conversations = await conversationService.getConversationsForUser(userId);
        reply.send({ conversations });
    });

    fastify.post<{ Body: ConversationCreate }>("/conversations", async (request, reply): Promise<void> => {
        const userId = request.userJwtPayload?.id;
        if (!userId) throw new UnauthorizedError();
        if (!request.body.type || !request.body.participantIds) {
            throw new ValidationError("Conversation type and participantIds are required");
        }

        const conversation = await conversationService.createConversation(userId, request.body);
        reply.status(201).send({ conversation });
    });

    fastify.get<{ Params: { conversationId: string } }>("/conversations/:conversationId/messages", async (request, reply): Promise<void> => {
        const userId = request.userJwtPayload?.id;
        if (!userId) throw new UnauthorizedError();

        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId: request.params.conversationId, userId }
        });
        if (!participant) throw new ForbiddenError("You are not a member of this conversation");

        const messages = await messageService.getMessagesForConversation(request.params.conversationId);
        reply.send({ messages });
    });
}
