import { MessagePublic } from "@micio/shared";
import { prisma } from "../db/client.js";
import { v7 as uuidv7 } from "uuid";
import { logger } from "../utils/logger.js";

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

        logger.debug({ senderId, conversationId }, "Message sent");
        return {
            id: message.id,
            message: message.message,
            senderId: message.senderId,
            conversationId: message.conversationId,
            createdAt: message.createdAt
        };
    }

    async getMessagesForConversation(conversationId: string): Promise<MessagePublic[]> {
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' }
        });

        logger.debug({ conversationId, count: messages.length }, "Fetched messages");
        return messages.map(m => ({
            id: m.id,
            message: m.message,
            senderId: m.senderId,
            conversationId: m.conversationId,
            createdAt: m.createdAt
        }));
    }
}