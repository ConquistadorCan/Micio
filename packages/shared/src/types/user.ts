import * as zod from 'zod';

export const UserSchema = zod.object({
    id: zod.uuid({ version: "v7" }),
    email: zod.email(),
    nickname: zod.string().min(3).max(25),
    password: zod.string().min(8).max(100),
    created_at: zod.date(),
    updated_at: zod.date()
});

export const UserCreateSchema = UserSchema.omit({ id: true, created_at: true, updated_at: true });
export const UserPublicSchema = UserSchema.pick({ id: true, email: true, nickname: true});

export type User = zod.infer<typeof UserSchema>;
export type UserPublic = zod.infer<typeof UserPublicSchema>;