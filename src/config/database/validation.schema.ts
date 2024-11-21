import { z } from 'zod';

export const DatabaseConfigSchema = z.object({
    DB_TYPE: z.enum(['postgres', 'mysql', 'better-sqlite3']).default('better-sqlite3'),
    DB_HOST: z.string().optional(),
    DB_PORT: z.number().optional(),
    DB_USERNAME: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_DATABASE: z.string().default('smart_home.db'),
    DB_SYNCHRONIZE: z.boolean().default(false),
    DB_LOGGING: z.boolean().default(false),
});

export type DatabaseConfigType = z.infer<typeof DatabaseConfigSchema>;
