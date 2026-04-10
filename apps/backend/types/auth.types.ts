export interface JwtPayload {
    id: string;
    email: string;
    nickname: string;
}

declare module "fastify" {
    interface FastifyRequest {
        userJwtPayload?: JwtPayload;
    }
}