import { FastifyInstance } from "fastify";
import { ConversationService } from "../services/conversations.service.js";
import { ConversationCreate } from "@micio/shared";

export async function conversationRoutes(fastify: FastifyInstance) {
    const conversationService = new ConversationService();

    fastify.get("/conversations", async (request, reply) => {
        try {
            const userJwtPayload = request.userJwtPayload!;
            const conversations = await conversationService.getConversationsForUser(userJwtPayload.id);
            reply.send({ conversations });
        }
        catch (error) {
            return reply.status(400).send({ error: "Failed to fetch conversations" });
        }
    })

    fastify.post< {Body: ConversationCreate} >("/conversations", async (request, reply) => {
        try {
            if (!request.body.type || !request.body.participantIds) {
                return reply.status(400).send({ error: "Conversation type and participantIds are required" });
            }
            const userJwtPayload = request.userJwtPayload!;
            const conversation = await conversationService.createConversation(userJwtPayload.id, request.body);
            reply.status(201).send({ conversation });
        }
        catch (error) {
            console.error(error);
            return reply.status(400).send({ error: "Failed to create conversation" });
        }
    });
}