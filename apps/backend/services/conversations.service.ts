import { prisma } from "../db/client.js";
import { v7 as uuidv7 } from "uuid";
import { ConversationCreate, ConversationPublic, ConversationTypeSchema } from "@micio/shared";
import { ConflictError, ValidationError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export class ConversationService {
    async getConversationsForUser(userId: string): Promise <ConversationPublic[]> {
        const conversations = await prisma.conversationParticipant.findMany({
            where: { userId },
            include: { 
                conversation: {
                    include: {
                        participants: {
                            include: { user: {
                                select: { id: true, nickname: true }
                            } }
                        }
                    }
                }
            }
        });

        const result = conversations.map(conversationParticipant => ({
            id: conversationParticipant.conversation.id,
            type: conversationParticipant.conversation.type,
            conversationName: conversationParticipant.conversation.conversationName ?? undefined,
            participants: conversationParticipant.conversation.participants.map(p => ({
                id: p.user.id,
                nickname: p.user.nickname
            }))
        }));

        logger.debug({ userId, count: result.length }, "Fetched conversations");
        return result;
    }

    async createConversation(userId: string, conversationData: ConversationCreate): Promise<ConversationPublic> {
        switch (conversationData.type) {
            case ConversationTypeSchema.enum.PRIVATE: {
                const participantIds = conversationData.participantIds.includes(userId)
                    ? conversationData.participantIds
                    : [...conversationData.participantIds, userId];

                if (participantIds.length !== 2) {
                    throw new ValidationError('Private conversation must have exactly 2 participants');
                }

                if (conversationData.conversationName) {
                    throw new ValidationError('Private conversation cannot have a name');
                }

                const existing = await prisma.conversation.findFirst({
                    where: {
                        type: ConversationTypeSchema.enum.PRIVATE,
                        participants: {
                            every: { userId: { in: participantIds } }
                        }
                    }
                });

                if (existing) {
                    throw new ConflictError('Private conversation already exists');
                }

                const conversation = await prisma.conversation.create({
                    data: {
                        id: uuidv7(),
                        type: ConversationTypeSchema.enum.PRIVATE,
                        participants: {
                            create: participantIds.map(id => ({
                                id: uuidv7(),
                                userId: id
                            }))
                        }
                    },
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: { id: true, nickname: true }
                                }
                            }
                        }
                    }
                })
                
                const privateResult = {
                    id: conversation.id,
                    type: conversation.type,
                    conversationName: conversation.conversationName ?? undefined,
                    participants: conversation.participants.map(p => ({
                        id: p.user.id,
                        nickname: p.user.nickname
                    }))
                };
                logger.info({ type: "PRIVATE", participantCount: participantIds.length, creatorId: userId }, "Conversation created");
                return privateResult;
            }
            case ConversationTypeSchema.enum.GROUP: {
                const participantIds = conversationData.participantIds.includes(userId)
                    ? conversationData.participantIds
                    : [...conversationData.participantIds, userId];

                if (participantIds.length < 3) {
                    throw new ValidationError('Group conversation must have at least 3 participants');
                }

                if (!conversationData.conversationName) {
                    throw new ValidationError('Group conversation must have a name');
                }

                const conversation = await prisma.conversation.create({
                    data: {
                        id: uuidv7(),
                        type: ConversationTypeSchema.enum.GROUP,
                        conversationName: conversationData.conversationName,
                        participants: {
                            create: participantIds.map(id => ({
                                id: uuidv7(),
                                userId: id
                            }))
                        }
                    },
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: { id: true, nickname: true }
                                }
                            }
                        }

                    }
                })
                
                const groupResult = {
                    id: conversation.id,
                    type: conversation.type,
                    conversationName: conversation.conversationName ?? undefined,
                    participants: conversation.participants.map(p => ({
                        id: p.user.id,
                        nickname: p.user.nickname
                    }))
                };
                logger.info({ type: "GROUP", participantCount: participantIds.length, creatorId: userId, name: conversationData.conversationName }, "Conversation created");
                return groupResult;
            }
        }
    }

}