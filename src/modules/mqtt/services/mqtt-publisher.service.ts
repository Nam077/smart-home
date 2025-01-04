import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IMqttPublisher } from '../interfaces/mqtt-publisher.interface';
import { CommandTypeEnum, TopicTypeEnum, ICommandMessage, IConfigMessage } from '../types/mqtt.types';

@Injectable()
export class MqttPublisherService implements IMqttPublisher {
    private readonly logger = new Logger(MqttPublisherService.name);
    private readonly BASE_TOPIC = 'home';
    private broker: any;

    constructor(private readonly configService: ConfigService) {}

    // Build topic path
    private buildTopic(roomId: string, deviceId?: string, type: TopicTypeEnum = TopicTypeEnum.CONTROL): string {
        const parts = [this.BASE_TOPIC, roomId];

        if (deviceId) parts.push(deviceId);
        parts.push(type);

        return parts.join('/');
    }

    // Broadcast Commands
    async broadcastToRoom(roomId: string, command: CommandTypeEnum): Promise<void> {
        const topic = this.buildTopic(roomId, null, TopicTypeEnum.BROADCAST);

        const message: ICommandMessage = {
            command,
            timestamp: new Date().toISOString(),
        };

        await this.publish({
            topic,
            payload: JSON.stringify(message),
            qos: 1,
            retain: false,
        });

        this.logger.debug(`Broadcast command ${command} to room ${roomId}`);
    }

    // Unicast Commands
    async publishToDevice(roomId: string, deviceId: string, command: CommandTypeEnum, value?: any): Promise<void> {
        const topic = this.buildTopic(roomId, deviceId, TopicTypeEnum.CONTROL);

        const message: ICommandMessage = {
            command,
            value,
            timestamp: new Date().toISOString(),
        };

        await this.publish({
            topic,
            payload: JSON.stringify(message),
            qos: 1,
            retain: false,
        });

        this.logger.debug(`Sent command ${command} to device ${deviceId} in room ${roomId}`);
    }

    // Config Commands
    async updateRoomConfig(roomId: string, config: Partial<IConfigMessage>): Promise<void> {
        const topic = this.buildTopic(roomId, null, TopicTypeEnum.CONFIG);

        const message: IConfigMessage = {
            ...config,
            timestamp: new Date().toISOString(),
        };

        await this.publish({
            topic,
            payload: JSON.stringify(message),
            qos: 1,
            retain: false,
        });

        this.logger.debug(`Updated config for room ${roomId}`);
    }

    // Subscribe to device updates
    async subscribeToDevice(roomId: string, deviceId: string): Promise<void> {
        if (!this.broker) {
            throw new Error('Broker not initialized');
        }

        // Subscribe to all device topics
        const topics = [
            this.buildTopic(roomId, deviceId, TopicTypeEnum.STATUS),
            this.buildTopic(roomId, deviceId, TopicTypeEnum.DATA),
            this.buildTopic(roomId, deviceId, TopicTypeEnum.ERROR),
        ];

        for (const topic of topics) {
            await new Promise((resolve, reject) => {
                this.broker.subscribe(topic, (error?: Error) => {
                    if (error) {
                        this.logger.error(`Error subscribing to ${topic}: ${error.message}`);
                        reject(error);
                    } else {
                        resolve(true);
                    }
                });
            });
        }

        this.logger.debug(`Subscribed to device ${deviceId} in room ${roomId}`);
    }

    // Subscribe to room updates
    async subscribeToRoom(roomId: string): Promise<void> {
        if (!this.broker) {
            throw new Error('Broker not initialized');
        }

        // Subscribe to room-level topics
        const topics = [
            this.buildTopic(roomId, null, TopicTypeEnum.BROADCAST),
            this.buildTopic(roomId, null, TopicTypeEnum.CONFIG),
        ];

        for (const topic of topics) {
            await new Promise((resolve, reject) => {
                this.broker.subscribe(topic, (error?: Error) => {
                    if (error) {
                        this.logger.error(`Error subscribing to ${topic}: ${error.message}`);
                        reject(error);
                    } else {
                        resolve(true);
                    }
                });
            });
        }

        this.logger.debug(`Subscribed to room ${roomId}`);
    }

    async publish(packet: any): Promise<void> {
        console.log('publishing packet', packet);

        if (!this.broker) {
            this.logger.error('Broker not initialized');
            throw new Error('Broker not initialized');
        }

        try {
            await new Promise((resolve, reject) => {
                this.broker.publish(
                    {
                        topic: packet.topic,
                        payload: Buffer.from(packet.payload),
                        qos: packet.qos || 0,
                        retain: packet.retain || false,
                    },
                    (error?: Error) => {
                        if (error) {
                            this.logger.error(`Error publishing to ${packet.topic}: ${error.message}`);
                            reject(error);
                        } else {
                            resolve(true);
                        }
                    },
                );
            });

            this.logger.debug(`Published message to ${packet.topic}`);
        } catch (error) {
            this.logger.error(`Error publishing message: ${error.message}`);
            throw error;
        }
    }

    setBroker(broker: any) {
        this.broker = broker;
    }
}
