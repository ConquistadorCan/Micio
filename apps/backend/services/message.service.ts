import { MessagePublic } from "@micio/shared";
import { prisma } from "../db/client.js";
import { v7 as uuidv7 } from "uuid";

export class MessageService {
    async sendMessage(senderId: string, conversationId: string, content: string): Promise<MessagePublic> {
        const message = await prisma.message.create({
            data: {
                id: uuidv7(),
                senderId: senderId,
                conversationId: conversationId,
                message: content
            }
        })

        return {
            id: message.id,
            message: message.message,
            senderId: message.senderId,
            conversationId: message.conversationId
        };
    }
}