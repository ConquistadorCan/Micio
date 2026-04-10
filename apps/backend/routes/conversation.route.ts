import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export async function conversationRoutes(fastify: FastifyInstance) {
    fastify.get("/conversations", {preHandler: authMiddleware}, async (request, reply) => {
        reply.send({ message: request.userJwtPayload });
    })
}