import * as zod from 'zod';

export const ConversationType = zod.enum(['private', 'group']);

export const ConversationSchema = zod.object({
    id: zod.uuid({ version: "v7" }),
    type: ConversationType,
    conversationName: zod.string().min(3).max(50).optional(),
    createdAt: zod.date(),
    updatedAt: zod.date()
});

export const ConversationCreateSchema = ConversationSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const ConversationPublicSchema = ConversationSchema.pick({ id: true, type: true, conversationName: true });

export type Conversation = zod.infer<typeof ConversationSchema>;
export type ConversationPublic = zod.infer<typeof ConversationPublicSchema>;
