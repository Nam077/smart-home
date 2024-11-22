import { registerAs } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';
import { z } from 'zod';

// Database specific configuration schema
export const DatabaseConfigSchema = z.object({
    DB_DATABASE: z.string().min(1, 'Database name is required'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type DatabaseConfigType = z.infer<typeof DatabaseConfigSchema>;

export default registerAs('database', (): DataSourceOptions => {
    // Validate database config
    const config = DatabaseConfigSchema.parse({
        DB_DATABASE: process.env.DB_DATABASE,
        NODE_ENV: process.env.NODE_ENV,
    });

    return {
        type: 'better-sqlite3',
        database: config.DB_DATABASE,
        entities: ['dist/**/*.entity{.ts,.js}'],
        synchronize: config.NODE_ENV === 'development',
        // logging: config.NODE_ENV === 'development',
        logging: false,
    };
});
