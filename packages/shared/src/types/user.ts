import * as zod from 'zod';

export const UserSchema = zod.object({
    id: zod.uuid({ version: "v7" }),
    email: zod.email(),
    nickname: zod.string().min(3).max(25),
    password: zod.string().min(8).max(100),
    createdAt: zod.date(),
    updatedAt: zod.date()
});

export const UserCreateSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UserPublicSchema = UserSchema.pick({ id: true, email: true, nickname: true});

export type User = zod.infer<typeof UserSchema>;
export type UserCreate = zod.infer<typeof UserCreateSchema>;
export type UserPublic = zod.infer<typeof UserPublicSchema>;