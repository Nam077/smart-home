import { registerAs } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';

export default registerAs(
    'database',
    () =>
        ({
            type: 'better-sqlite3',
            database: process.env.DB_DATABASE || 'smart_home.db',
            entities: ['dist/**/*.entity{.ts,.js}'],
            synchronize: process.env.NODE_ENV === 'development',
            logging: process.env.NODE_ENV === 'development',
        }) as DataSourceOptions,
);
