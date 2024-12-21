import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@app/modules/auth/auth.module';
import { ControllerModule } from '@app/modules/controller/controller.module';
import { DeviceModule } from '@app/modules/device/device.module';
import { GlobalModule } from '@app/modules/global/global.module';
import { MqttModule } from '@app/modules/mqtt/mqtt.module';
import { RoomModule } from '@app/modules/room/room.module';
import { UserModule } from '@app/modules/user/user.module';

import appConfig from './config/app/configuration';
import databaseConfig from './config/database/configuration';
import { validateConfig } from './config/env.validation';
import { VoiceControllerModule } from './modules/voice-controller/voice-controller.module';
import jwtConfig from './config/jwt/configuration';

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
        GlobalModule,
        UserModule,
        AuthModule,
        DeviceModule,
        RoomModule,
        MqttModule,
        ControllerModule,
        VoiceControllerModule,
    ],
})
export class AppModule {}
