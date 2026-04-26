import { FastifyInstance } from "fastify";
import { UserService } from "../services/user.service.js";
import { ValidationError } from "../utils/errors.js";

export async function userRoutes(fastify: FastifyInstance) {
    const userService = new UserService()

    fastify.get<{ Querystring: { q: string } }>("/users/search", async (request, reply) => {
        if (!request.query.q) {
            throw new ValidationError("Search query is required");
        }

        const users = await userService.searchUsers(
            request.query.q,
            request.userJwtPayload!.id
        );

        reply.send({ users });
    });
}