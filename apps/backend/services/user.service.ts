import { UserPublic, UserCreate } from "@micio/shared";
import { prisma } from "../db/client.js";
import { v7 as uuidv7 } from "uuid";
import { hash } from "bcrypt";
import { ConflictError } from "../utils/errors.js";

const SALT_ROUNDS = 10;

export class UserService {

    async createUser(userData: UserCreate): Promise<UserPublic> {
        await this.checkMailAndNicknameExists(userData.email, userData.nickname);

        const hashedPassword = await hash(userData.password, SALT_ROUNDS);

        const id = uuidv7();

        const newUser = await prisma.user.create({
            data: {
                id,
                email: userData.email,
                nickname: userData.nickname,
                password: hashedPassword
            }
        });

        return newUser;
    }

    private async checkMailAndNicknameExists(email: string, nickname: string) {
        const [existingMail, existingNickname] = await Promise.all([
            prisma.user.findUnique({ where: { email: email } }),
            prisma.user.findUnique({ where: { nickname: nickname } })
        ]);

        if (existingMail) {
            throw new ConflictError("Email already in use");
        }

        if (existingNickname) {
            throw new ConflictError("Nickname already in use");
        }
    }
}