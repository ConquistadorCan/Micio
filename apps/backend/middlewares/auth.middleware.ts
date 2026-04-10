import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import env from "../config/index.js";
import { JwtPayload } from "../types/auth.types.js";


export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return reply.status(401).send({
                success: false,
                message: "Unauthorized"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, env.JWT_SECRET);

        request.userJwtPayload = decoded as JwtPayload;
    }

    catch (error) {
        return reply.status(401).send({
            success: false,
            message: "Invalid or expired token"
        });
    }
}