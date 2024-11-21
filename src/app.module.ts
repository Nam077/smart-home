import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import appConfig from './config/app/configuration';
import databaseConfig from './config/database/configuration';
import { validateConfig } from './config/env.validation';
import jwtConfig from './config/jwt/configuration';
import { UsersModule } from './modules/users/users.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, jwtConfig],
            validate: validateConfig,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => configService.get('database'),
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 10,
            },
        ]),
        UsersModule,
    ],
})
export class AppModule {}
