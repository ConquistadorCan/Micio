import { FastifyInstance } from "fastify";
import { ConversationService } from "../services/conversations.service.js";
import { MessageService } from "../services/message.service.js";
import { ConversationCreate } from "@micio/shared";
import { ValidationError } from "../utils/errors.js";

export async function conversationRoutes(fastify: FastifyInstance) {
    const conversationService = new ConversationService();
    const messageService = new MessageService();

    fastify.get("/conversations", async (request, reply) => {
        const conversations = await conversationService.getConversationsForUser(request.userJwtPayload!.id);
        reply.send({ conversations });
    });

    fastify.post<{ Body: ConversationCreate }>("/conversations", async (request, reply) => {
        if (!request.body.type || !request.body.participantIds) {
            throw new ValidationError("Conversation type and participantIds are required");
        }

        const conversation = await conversationService.createConversation(request.userJwtPayload!.id, request.body);
        reply.status(201).send({ conversation });
    });

    fastify.get<{ Params: { conversationId: string } }>("/conversations/:conversationId/messages", async (request, reply) => {
        const messages = await messageService.getMessagesForConversation(request.params.conversationId);
        reply.send({ messages });
    });
}
