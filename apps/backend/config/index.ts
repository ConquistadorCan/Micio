import * as zod from 'zod';
import 'dotenv/config';

const envSchema = zod.object({
    DATABASE_URL: zod.string(),
    DIRECT_URL: zod.string(),
    JWT_SECRET: zod.string(),
    PORT: zod.string().transform(val => parseInt(val, 10)),
    CLIENT_URL: zod.string(),
    REFRESH_TOKEN_EXPIRES_IN: zod.string().transform(val => parseInt(val, 10)),
    ACCESS_TOKEN_EXPIRES_IN: zod.string().transform(val => parseInt(val, 10)),
    BETTERSTACK_SOURCE_TOKEN: zod.string().optional(),
    BETTERSTACK_INGESTING_HOST: zod.string().optional()
})

const env = envSchema.parse(process.env);

export default env;
