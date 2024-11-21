import { registerAs } from '@nestjs/config';
import type { z } from 'zod';

import { AppConfigSchema } from './validation.schema';

export type AppConfigType = z.infer<typeof AppConfigSchema>;

export default registerAs('app', () => {
    const config = AppConfigSchema.parse({
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
        API_PREFIX: process.env.API_PREFIX,
        APP_NAME: process.env.APP_NAME,
        APP_DESCRIPTION: process.env.APP_DESCRIPTION,
        APP_VERSION: process.env.APP_VERSION,
    });

    return {
        nodeEnv: config.NODE_ENV,
        port: config.PORT,
        apiPrefix: config.API_PREFIX,
        name: config.APP_NAME,
        description: config.APP_DESCRIPTION,
        version: config.APP_VERSION,
    };
});
