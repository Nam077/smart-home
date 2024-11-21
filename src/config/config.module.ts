import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import databaseConfig from './database/configuration';
import { validateConfig } from './env.validation';

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
            validate: validateConfig,
            validationOptions: {
                allowUnknown: true,
                abortEarly: false,
            },
        }),
    ],
})
export class ConfigModule {}
