import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(1),
    MAIL_USER: z.string().min(1).default(''),
    MAIL_PASS: z.string().min(1).default(''),
})

export const env = envSchema.parse(process.env)
