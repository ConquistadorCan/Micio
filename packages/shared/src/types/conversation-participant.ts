import * as zod from 'zod';

export const ConversationParticipantSchema = zod.object({
    id: zod.uuid({ version: "v7" }),
    conversationId: zod.uuid({ version: "v7" }),
    userId: zod.uuid({ version: "v7" }),
    isMuted: zod.boolean().default(false),
    lastSeen: zod.date(),
    createdAt: zod.date(),
    updatedAt: zod.date()
});

export const ConversationParticipantCreateSchema = ConversationParticipantSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const ConversationParticipantPublicSchema = ConversationParticipantSchema.pick({ id: true, conversationId: true, userId: true, isMuted: true, lastSeen: true });

export type ConversationParticipant = zod.infer<typeof ConversationParticipantSchema>;
export type ConversationParticipantPublic = zod.infer<typeof ConversationParticipantPublicSchema>;