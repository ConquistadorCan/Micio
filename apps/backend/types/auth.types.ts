import { UserPublic } from "@micio/shared";

declare module "fastify" {
    interface FastifyRequest {
        userJwtPayload?: UserPublic;
    }
}