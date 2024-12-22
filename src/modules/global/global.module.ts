import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MqttPublisherService } from './services/mqtt-publisher.service';
import { AIService } from './services/ai.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [MqttPublisherService, AIService],
    exports: [MqttPublisherService, AIService],
})
export class GlobalModule {}
