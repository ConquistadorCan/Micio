import * as zod from 'zod';
import 'dotenv/config';

const envSchema = zod.object({
    DATABASE_URL: zod.string(),
    JWT_SECRET: zod.string(),
    JWT_REFRESH_SECRET: zod.string(),
    PORT: zod.string().transform(val => parseInt(val, 10)),
    CLIENT_URL: zod.string()
})

const env = envSchema.parse(process.env);

export default env;
