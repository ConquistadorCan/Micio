import * as zod from 'zod';

export const MessageSchema = zod.object({
    id: zod.uuid({ version: "v7" }),
    senderId: zod.uuid({ version: "v7" }),
    message: zod.string().min(1).max(2000),
    conversationId: zod.uuid({ version: "v7" }),
    createdAt: zod.date(),
    updatedAt: zod.date()
});

export const MessageCreateSchema = MessageSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const MessagePublicSchema = MessageSchema.pick({ id: true, senderId: true, message: true, conversationId: true, createdAt: true });

export type Message = zod.infer<typeof MessageSchema>;
export type MessagePublic = zod.infer<typeof MessagePublicSchema>;