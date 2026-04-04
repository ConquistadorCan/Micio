import * as zod from 'zod';

export const ConversationType = zod.enum(['private', 'group']);

export const ConversationSchema = zod.object({
    id: zod.uuid({ version: "v7" }),
    type: ConversationType,
    conversation_name: zod.string().min(3).max(50).optional(),
    created_at: zod.date(),
    updated_at: zod.date()
});

export const ConversationCreateSchema = ConversationSchema.omit({ id: true, created_at: true, updated_at: true });
export const ConversationPublicSchema = ConversationSchema.pick({ id: true, type: true, conversation_name: true });

export type Conversation = zod.infer<typeof ConversationSchema>;
export type ConversationPublic = zod.infer<typeof ConversationPublicSchema>;
