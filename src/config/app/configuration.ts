import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const AppConfigSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.number().default(3000),
    API_PREFIX: z.string().default('api'),
});

export type AppConfigType = z.infer<typeof AppConfigSchema>;

export default registerAs('app', () => {
    const config = AppConfigSchema.parse({
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
        API_PREFIX: process.env.API_PREFIX,
    });

    return {
        nodeEnv: config.NODE_ENV,
        port: config.PORT,
        apiPrefix: config.API_PREFIX,
    };
});
