import { FastifyInstance } from "fastify";
import { AuthService } from "../services/auth.service.js";
import { UserCreate, UserLogin } from "@micio/shared";
import env from "../config/index.js";

export async function authRoutes(fastify: FastifyInstance) {
    const authService = new AuthService();

    fastify.post<{ Body: UserCreate }>("/register", async (request, reply) => {
        try {
            if (!request.body.email || !request.body.password || !request.body.nickname) {
                return reply.status(400).send({ error: "Email, password and nickname are required" });
            }

            const { accessToken, refreshToken } = await authService.register(request.body);

            reply.setCookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: env.REFRESH_TOKEN_EXPIRES_IN / 1000 // Convert milliseconds to seconds
            });

            reply.send({ accessToken });
        }
        catch (error) {
            return reply.status(400).send({ error: "Registration failed" });
        }
    });

    fastify.post<{ Body: UserLogin }>("/login", async (request, reply) => {
        try {
            if (!request.body.email || !request.body.password) {
                return reply.status(400).send({ error: "Email and password are required" });
            }

            const {accessToken, refreshToken} = await authService.login(request.body.email, request.body.password)

            reply.setCookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: env.REFRESH_TOKEN_EXPIRES_IN / 1000 // Convert milliseconds to seconds
            });

            reply.send({ accessToken });
        }
        catch (error) {
            return reply.status(400).send({ error: "Invalid email or password" });
        }
    });

    fastify.post("/refresh", async (request, reply) => {
        try {
            const refreshToken = request.cookies.refreshToken;
            if (!refreshToken) {
                return reply.status(400).send({ error: "Refresh token is required" });
            }

            const {accessToken , newRefreshToken} = await authService.refreshTokens(refreshToken);

            reply.setCookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: env.REFRESH_TOKEN_EXPIRES_IN / 1000 // Convert milliseconds to seconds
            });

            reply.send({ accessToken });
        }
        catch (error) {
            return reply.status(400).send({ error: "Invalid refresh token" });
        }
    });

    fastify.post("/logout", async (request, reply) => {
        try {
            const refreshToken = request.cookies.refreshToken;
            if (!refreshToken) {
                return reply.status(400).send({ error: "Refresh token is required" });
            }

            await authService.logout(refreshToken);

            reply.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict"
            });

            reply.send({ message: "Logged out successfully" });
        }
        catch (error) {
            return reply.status(400).send({ error: "Logout failed" });
        }
    });
}