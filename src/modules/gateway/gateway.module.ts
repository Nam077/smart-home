import { Module } from '@nestjs/common';

import { DeviceModule } from '@app/modules/device/device.module';

import { EventsGateway } from './events.gateway';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
    imports: [MqttModule, DeviceModule],
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class GatewayModule {}
