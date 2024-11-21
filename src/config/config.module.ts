import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import appConfig from './app/configuration';
import databaseConfig from './database/configuration';
import { validateConfig } from './env.validation';
import jwtConfig from './jwt/configuration';

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, jwtConfig],
            validate: validateConfig,
            validationOptions: {
                abortEarly: true,
                cache: true,
            },
        }),
    ],
})
export class ConfigModule {}
