import { FastifyInstance } from "fastify";
import { ConversationService } from "../services/conversations.service.js";
import { ConversationCreate } from "@micio/shared";
import { ValidationError } from "../utils/errors.js";

export async function conversationRoutes(fastify: FastifyInstance) {
    const conversationService = new ConversationService();

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
}
