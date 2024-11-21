import { z } from 'zod';

export const AppConfigSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.number().default(3000),
    API_PREFIX: z.string().default('api'),
    APP_NAME: z.string().default('Smart Home Backend'),
    APP_DESCRIPTION: z.string().default('Smart Home Backend API'),
    APP_VERSION: z.string().default('0.1.0'),
});

export type AppConfigType = z.infer<typeof AppConfigSchema>;
