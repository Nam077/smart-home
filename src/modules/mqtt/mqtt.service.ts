import { Server } from 'net';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Aedes from 'aedes';
import { createBroker } from 'aedes';
import { createServer } from 'aedes-server-factory';

import { Device } from '@app/modules/device/entities/device.entity';
import { DeviceService } from '@app/modules/device/services/device.service';
import { MqttPublisherService } from '@app/modules/global/services/mqtt-publisher.service';

import {
    DeviceControlBaseDto,
    DeviceStatusControlDto,
    DeviceValueControlDto,
    DeviceConfigControlDto,
} from './dto/device-control.dto';
import { IMqttPublisher } from './interfaces/mqtt-publisher.interface';
import { MqttHandlerService } from './services/mqtt-handler.service';
import { CommandTypeEnum } from './types/mqtt.types';

interface IAuthenticateError extends Error {
    returnCode: number;
}

@Injectable()
export class MqttService implements OnModuleInit, IMqttPublisher {
    private readonly logger = new Logger(MqttService.name);
    private broker: Aedes;
    private server: Server;
    private wsServer: Server;

    constructor(
        private readonly configService: ConfigService,
        private readonly deviceService: DeviceService,
        private readonly mqttHandler: MqttHandlerService,
        private readonly mqttPublisher: MqttPublisherService,
    ) {
        this.setupBroker();
    }

    async onModuleInit() {
        await this.startServer();
    }

    private formatLogMessage(action: string, details: Record<string, any>): string {
        return `[${action}] ${JSON.stringify(details, null, 2)}`;
    }

    private async startServer() {
        const port = this.configService.get<number>('mqtt.port');
        const wsPort = this.configService.get<number>('mqtt.wsPort');

        this.server = createServer(this.broker);
        this.server.listen(port, () => {
            this.logger.log(
                this.formatLogMessage('SERVER_STARTED', {
                    type: 'TCP',
                    port,
                }),
            );
        });

        this.wsServer = createServer(this.broker, { ws: true });
        this.wsServer.listen(wsPort, () => {
            this.logger.log(
                this.formatLogMessage('SERVER_STARTED', {
                    type: 'WebSocket',
                    port: wsPort,
                }),
            );
        });
    }

    private setupBroker() {
        this.broker = createBroker({
            id: 'smart-home-broker',
            concurrency: 1000, // Hỗ trợ tới 1000 client đồng thởi
            heartbeatInterval: 60000, // 60 seconds
        });

        this.mqttPublisher.setBroker(this.broker);
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.broker.on('client', (client) => {
            this.logger.log(
                this.formatLogMessage('CLIENT_CONNECTED', {
                    clientId: client.id,
                    timestamp: new Date().toISOString(),
                }),
            );
        });

        this.broker.on('clientDisconnect', (client) => {
            this.logger.log(
                this.formatLogMessage('CLIENT_DISCONNECTED', {
                    clientId: client.id,
                    timestamp: new Date().toISOString(),
                }),
            );
        });

        this.broker.on('subscribe', (subscriptions, client) => {
            this.logger.debug(
                this.formatLogMessage('CLIENT_SUBSCRIBED', {
                    clientId: client.id,
                    subscriptions: subscriptions.map((sub) => ({
                        topic: sub.topic,
                        qos: sub.qos,
                    })),
                }),
            );
        });

        this.broker.on('publish', async (packet, client) => {
            if (!client) return;

            try {
                const topic = packet.topic;
                const message = packet.payload.toString();
                const payload = JSON.parse(message);
                const topicParts = topic.split('/');
                const messageType = topicParts[topicParts.length - 1];

                if (messageType === 'status') {
                    this.logger.debug(
                        this.formatLogMessage('STATUS_MESSAGE_RECEIVED', {
                            clientId: client.id,
                            topic,
                            payload,
                            timestamp: new Date().toISOString(),
                        }),
                    );
                } else {
                    this.logger.debug(
                        this.formatLogMessage('MESSAGE_RECEIVED', {
                            clientId: client.id,
                            topic,
                            messageType,
                        }),
                    );
                }

                await this.mqttHandler.handleMessage(topic, payload, client.id);
            } catch (error) {
                this.logger.error(
                    this.formatLogMessage('MESSAGE_PROCESSING_ERROR', {
                        clientId: client?.id,
                        error: error.message,
                        stack: error.stack,
                    }),
                );
            }
        });

        this.broker.authenticate = (client, username, password, callback) => {
            const mqttUsername = this.configService.get<string>('mqtt.username');
            const mqttPassword = this.configService.get<string>('mqtt.password');

            // Only check username and password, accept any client ID
            const isAuthenticated =
                (!mqttUsername && !mqttPassword) ||
                (username === mqttUsername && password?.toString() === mqttPassword);

            if (isAuthenticated) {
                this.logger.debug(
                    this.formatLogMessage('AUTHENTICATION_SUCCESS', {
                        clientId: client.id,
                        username,
                    }),
                );
                callback(null, true);
            } else {
                this.logger.warn(
                    this.formatLogMessage('AUTHENTICATION_FAILED', {
                        clientId: client.id,
                        username,
                        reason: 'Invalid credentials',
                    }),
                );

                callback(
                    {
                        name: 'AuthenticateError',
                        message: 'Authentication failed',
                        returnCode: 4,
                    } as IAuthenticateError,
                    false,
                );
            }
        };
    }

    private async updateDeviceConnection(deviceId: string, isConnected: boolean) {
        try {
            const device = await this.deviceService.findOne({ where: { id: deviceId } });

            if (!device) {
                this.logger.warn(this.formatLogMessage('DEVICE_NOT_FOUND', { deviceId }));

                return;
            }

            device.isConnected = isConnected;
            device.lastSeenAt = new Date();
            await device.save();

            this.logger.debug(
                this.formatLogMessage('DEVICE_CONNECTION_UPDATED', {
                    deviceId,
                    isConnected,
                    lastSeenAt: device.lastSeenAt,
                }),
            );
        } catch (error) {
            this.logger.error(
                this.formatLogMessage('CONNECTION_UPDATE_ERROR', {
                    deviceId,
                    error: error.message,
                }),
            );
        }
    }

    async handleDeviceControl(deviceId: string, payload: any): Promise<Device> {
        this.logger.debug(`Handling device control for device ${deviceId}`);

        return this.mqttHandler.handleDeviceControl(deviceId, payload);
    }

    async publishToDevice(deviceId: string, topic: string, message: any): Promise<void> {
        return this.mqttPublisher.publishToDevice(deviceId, topic, message);
    }

    async publish(packet: any): Promise<void> {
        return this.mqttPublisher.publish(packet);
    }

    async publishControl(deviceId: string, command: DeviceControlBaseDto): Promise<void> {
        const roomId = await this.deviceService.getRoomIdByDeviceId(deviceId);

        if (!roomId) {
            throw new Error(`Device ${deviceId} not found or not associated with any room`);
        }

        let payload: any;

        switch (command.command) {
            case CommandTypeEnum.SET_STATUS:
                payload = command as DeviceStatusControlDto;
                break;
            case CommandTypeEnum.SET_VALUE:
                payload = command as DeviceValueControlDto;
                break;
            case CommandTypeEnum.UPDATE_CONFIG:
                payload = command as DeviceConfigControlDto;
                break;
            default:
                throw new Error(`Unsupported command type: ${command.command}`);
        }

        await this.mqttPublisher.publishToDevice(roomId, deviceId, command.command, payload.value);
    }
}
