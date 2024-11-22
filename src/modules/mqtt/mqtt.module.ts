import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import mqttConfig from '@app/modules/mqtt/mqtt.config';

import { MqttController } from './mqtt.controller';
import { MqttService } from './mqtt.service';
import { DeviceModule } from '../device/device.module';

@Module({
    imports: [ConfigModule.forFeature(mqttConfig), DeviceModule],
    providers: [MqttService],
    controllers: [MqttController],
    exports: [MqttService],
})
export class MqttModule {}
