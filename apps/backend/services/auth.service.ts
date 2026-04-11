import { UserCreate, UserPublic } from "@micio/shared";
import { UserService } from "./user.service.js";
import { v7 as uuidv7 } from "uuid";
import { prisma } from "../db/client.js";
import { compare } from "bcrypt";
import env from "../config/index.js";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/auth.types.js";
import { UnauthorizedError, NotFoundError } from "../utils/errors.js";

const userService = new UserService();

export class AuthService {
    async register(userData: UserCreate): Promise<{ accessToken: string; refreshToken: string; }> {
        const newUser = await userService.createUser(userData);

        const { accessToken, refreshToken } = await this.generateTokens({
            id: newUser.id,
            email: newUser.email,
            nickname: newUser.nickname
        });

        return { accessToken, refreshToken };
    }

    async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; }> {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const { accessToken, refreshToken } = await this.generateTokens({
            id: user.id,
            email: user.email,
            nickname: user.nickname
        });

        return { accessToken, refreshToken };
    }

    async refreshTokens(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string; }> {
        const refreshTokenData = await prisma.refreshToken.findUnique({ where:  { token: refreshToken }  });

        if (!refreshTokenData || refreshTokenData.expiresAt < new Date()) {
            throw new UnauthorizedError("Invalid refresh token");
        }

        const user = await prisma.user.findUnique({ where: { id: refreshTokenData.userId } });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens({
            id: user.id,
            email: user.email,
            nickname: user.nickname
        });

        await prisma.refreshToken.delete({ where: { token: refreshToken } });

        return { accessToken, newRefreshToken };
    }

    async logout(refreshToken: string): Promise<void> {
        await prisma.refreshToken.delete({ where: { token: refreshToken } });
    }

    private async generateTokens(userData: UserPublic): Promise<{ accessToken: string; refreshToken: string; }> {
        const payload: JwtPayload = {
            id: userData.id,
            email: userData.email,
            nickname: userData.nickname
        }

        const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

        const refreshTokenId = uuidv7();

        await prisma.refreshToken.deleteMany({ where: { userId: userData.id } });

        await prisma.refreshToken.create({
            data: {
                id: refreshTokenId,
                token: refreshToken,
                userId: userData.id,
                expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN)
            }
        });

        return { accessToken, refreshToken };
    }
}