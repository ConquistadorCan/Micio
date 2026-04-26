import { FastifyInstance } from "fastify";
import { UserService } from "../services/user.service.js";
import { UnauthorizedError, ValidationError } from "../utils/errors.js";

export async function userRoutes(fastify: FastifyInstance) {
    const userService = new UserService()

    fastify.get<{ Querystring: { q: string } }>("/users/search", async (request, reply): Promise<void> => {
        if (!request.query.q) {
            throw new ValidationError("Search query is required");
        }

        const userId = request.userJwtPayload?.id;
        if (!userId) throw new UnauthorizedError();

        const users = await userService.searchUsers(request.query.q, userId);
        reply.send({ users });
    });
}