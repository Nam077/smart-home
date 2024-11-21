import { registerAs } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';
import type { z } from 'zod';

import { DatabaseConfigSchema } from './validation.schema';

export type DatabaseConfigType = z.infer<typeof DatabaseConfigSchema>;

export default registerAs('database', (): DataSourceOptions => {
    // Validate database config
    const config = DatabaseConfigSchema.parse({
        DB_TYPE: process.env.DB_TYPE,
        DB_DATABASE: process.env.DB_DATABASE,
        DB_SYNCHRONIZE: process.env.DB_SYNCHRONIZE === 'true',
        DB_LOGGING: process.env.DB_LOGGING === 'true',
        NODE_ENV: process.env.NODE_ENV,
    });

    return {
        type: config.DB_TYPE,
        database: config.DB_DATABASE,
        entities: ['dist/**/*.entity{.ts,.js}'],
        synchronize: config.DB_SYNCHRONIZE,
        logging: config.DB_LOGGING,
    };
});
