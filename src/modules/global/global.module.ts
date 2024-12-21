import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MqttPublisherService } from './services/mqtt-publisher.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [MqttPublisherService],
    exports: [MqttPublisherService],
})
export class GlobalModule {}
