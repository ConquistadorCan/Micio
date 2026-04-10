import * as zod from 'zod';
import { UserMinimalSchema } from './user.js';

export const ConversationTypeSchema = zod.enum(['PRIVATE', 'GROUP']);
export type ConversationType = zod.infer<typeof ConversationTypeSchema>;

export const ConversationSchema = zod.object({
    id: zod.uuid({ version: "v7" }),
    type: ConversationTypeSchema,
    conversationName: zod.string().min(3).max(50).optional(),
    createdAt: zod.date(),
    updatedAt: zod.date()
});

export const ConversationCreateSchema = ConversationSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
    participantIds: zod.array(zod.uuid({ version: "v7" })).min(1)
});

export const ConversationPublicSchema = ConversationSchema.pick({ id: true, type: true, conversationName: true }).extend({
    participants: zod.array(UserMinimalSchema)
});

export type Conversation = zod.infer<typeof ConversationSchema>;
export type ConversationCreate = zod.infer<typeof ConversationCreateSchema>;
export type ConversationPublic = zod.infer<typeof ConversationPublicSchema>;