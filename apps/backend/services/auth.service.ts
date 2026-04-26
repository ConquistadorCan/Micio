import { UserCreate, UserPublic } from "@micio/shared";
import { UserService } from "./user.service.js";
import { v7 as uuidv7 } from "uuid";
import { prisma } from "../db/client.js";
import { Prisma } from "../prisma/generated/prisma/index.js";
import { compare } from "bcrypt";
import env from "../config/index.js";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { UnauthorizedError, NotFoundError } from "../utils/errors.js";
import { createHash } from "crypto";


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

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await compare(password, user.password))) {
            throw new UnauthorizedError("Invalid email or password");
        }

        return await prisma.$transaction(async (tx) => {
            await tx.refreshToken.deleteMany({ where: { userId: user.id } });

            const tokens = this.generateTokens(user);

            await this.saveRefreshToken(tx, user.id, tokens.refreshToken);

            return tokens;
        });
    }

    async refreshTokens(oldToken: string) {
        const hashedOldToken = this.hashToken(oldToken);

        return await prisma.$transaction(async (tx) => {
            const tokenData = await tx.refreshToken.findUnique({
                where: { token: hashedOldToken }
            });

            if (!tokenData || tokenData.expiresAt < new Date()) {
                throw new UnauthorizedError("Invalid refresh token");
            }

            const user = await tx.user.findUnique({
                where: { id: tokenData.userId }
            });

            if (!user) {
                throw new NotFoundError("User not found");
            }

            await tx.refreshToken.deleteMany({
                where: { token: hashedOldToken }
            });

            const tokens = this.generateTokens(user);

            await this.saveRefreshToken(tx, user.id, tokens.refreshToken);

            return {
                accessToken: tokens.accessToken,
                newRefreshToken: tokens.refreshToken
            };
        });
    }

    async logout(refreshToken: string) {
        const hashedOldToken = this.hashToken(refreshToken);

        await prisma.refreshToken.deleteMany({
            where: { token: hashedOldToken }
        });
    }

    private generateTokens(userData: UserPublic): { accessToken: string; refreshToken: string } {
        const payload = {
            id: userData.id,
            email: userData.email,
            nickname: userData.nickname
        };

        const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: Math.floor(env.ACCESS_TOKEN_EXPIRES_IN / 1000) });

        const refreshToken = randomBytes(64).toString("hex");

        return { accessToken, refreshToken };
    }

    private async saveRefreshToken(
        tx: Prisma.TransactionClient,
        userId: string,
        refreshToken: string
    ) {
        const hashedToken = this.hashToken(refreshToken);

        await tx.refreshToken.create({
            data: {
                id: uuidv7(),
                token: hashedToken,
                userId,
                expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN)
            }
        });
    }

    private hashToken(token: string) {
        return createHash("sha256").update(token).digest("hex");
    }
}