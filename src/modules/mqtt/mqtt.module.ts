import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import mqttConfig from '@app/modules/mqtt/mqtt.config';

import { MqttService } from './mqtt.service';
import { DeviceModule } from '../device/device.module';
import { MqttHandlerService } from './services/mqtt-handler.service';
import { MqttHeartbeatService } from './services/mqtt-heartbeat.service';
import { MqttPublisherService } from './services/mqtt-publisher.service';

@Module({
    imports: [ConfigModule.forFeature(mqttConfig), ConfigModule, ScheduleModule.forRoot(), DeviceModule],
    providers: [MqttPublisherService, MqttService, MqttHandlerService, MqttHeartbeatService],
    exports: [MqttService],
})
export class MqttModule {}
