import { FastifyInstance } from "fastify";
import { AuthService } from "../services/auth.service.js";
import { UserCreate, UserLogin } from "@micio/shared";
import { ValidationError } from "../utils/errors.js";
import env from "../config/index.js";

export async function authRoutes(fastify: FastifyInstance) {
    const authService = new AuthService();

    fastify.post<{ Body: UserCreate }>("/register", async (request, reply): Promise<void> => {
        if (!request.body.email || !request.body.password || !request.body.nickname) {
            throw new ValidationError("Email, password and nickname are required");
        }

        const { accessToken, refreshToken } = await authService.register(request.body);

        reply.setCookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: env.REFRESH_TOKEN_EXPIRES_IN / 1000
        });

        reply.send({ accessToken });
    });

    fastify.post<{ Body: UserLogin }>("/login", async (request, reply): Promise<void> => {
        if (!request.body.email || !request.body.password) {
            throw new ValidationError("Email and password are required");
        }

        const { accessToken, refreshToken } = await authService.login(request.body.email, request.body.password);

        reply.setCookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: env.REFRESH_TOKEN_EXPIRES_IN / 1000
        });

        reply.send({ accessToken });
    });

    fastify.post("/refresh", async (request, reply): Promise<void> => {
        const refreshToken = request.cookies.refreshToken;
        if (!refreshToken) {
            throw new ValidationError("Refresh token is required");
        }

        const { accessToken, newRefreshToken } = await authService.refreshTokens(refreshToken);

        reply.setCookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: env.REFRESH_TOKEN_EXPIRES_IN / 1000
        });

        reply.send({ accessToken });
    });

    fastify.post("/logout", async (request, reply): Promise<void> => {
        const refreshToken = request.cookies.refreshToken;
        if (!refreshToken) {
            throw new ValidationError("Refresh token is required");
        }

        await authService.logout(refreshToken);

        reply.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        reply.send({ message: "Logged out successfully" });
    });
}
