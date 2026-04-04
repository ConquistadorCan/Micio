import * as zod from 'zod';

export const MessageSchema = zod.object({
    id: zod.uuid({ version: "v7" }),
    sender_id: zod.uuid({ version: "v7" }),
    message: zod.string().min(1).max(2000),
    conversation_id: zod.uuid({ version: "v7" }),
    created_at: zod.date(),
    updated_at: zod.date()
});

export const MessageCreateSchema = MessageSchema.omit({ id: true, created_at: true, updated_at: true });
export const MessagePublicSchema = MessageSchema.pick({ id: true, sender_id: true, message: true, conversation_id: true });

export type Message = zod.infer<typeof MessageSchema>;
export type MessagePublic = zod.infer<typeof MessagePublicSchema>;