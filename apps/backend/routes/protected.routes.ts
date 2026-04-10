import { FastifyInstance } from "fastify/types/instance.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { conversationRoutes } from "./conversation.route.js";

export async function protectedRoutes(fastify: FastifyInstance) {
    fastify.addHook("preHandler", authMiddleware);

    fastify.register(conversationRoutes);
}