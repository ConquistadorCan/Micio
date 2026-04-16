import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import env from "../config/index.js";
import { UserPublic } from "@micio/shared";
import { UnauthorizedError } from "../utils/errors.js";


export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing or malformed authorization header");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        request.userJwtPayload = decoded as UserPublic;
    } catch {
        throw new UnauthorizedError("Invalid or expired token");
    }
}
