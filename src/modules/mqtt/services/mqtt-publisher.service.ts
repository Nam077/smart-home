import { promisify } from 'util';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IMqttPublisher } from '../interfaces/mqtt-publisher.interface';

@Injectable()
export class MqttPublisherService implements IMqttPublisher {
    private readonly logger = new Logger(MqttPublisherService.name);
    private broker: any;

    constructor(private readonly configService: ConfigService) {}

    async publish(packet: any): Promise<void> {
        if (!this.broker) {
            this.logger.error('Broker not initialized');
            throw new Error('Broker not initialized');
        }

        try {
            const publishAsync = promisify(this.broker.publish.bind(this.broker));

            await publishAsync(packet);
        } catch (error) {
            this.logger.error(`Error publishing message: ${error.message}`);
            throw error;
        }
    }

    async publishToDevice(deviceId: string, topic: string, message: any): Promise<void> {
        const fullTopic = `device/${deviceId}/${topic}`;

        try {
            const packet = {
                topic: fullTopic,
                payload: JSON.stringify(message),
                qos: 1,
                retain: false,
            };

            await this.publish(packet);
            this.logger.debug(`Published message to ${fullTopic}: ${JSON.stringify(message)}`);
        } catch (error) {
            this.logger.error(`Error publishing to device ${deviceId}: ${error.message}`);
            throw error;
        }
    }

    setBroker(broker: any) {
        this.broker = broker;
    }
}
