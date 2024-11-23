import { Server } from 'net';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Aedes from 'aedes';
import { createBroker } from 'aedes';
import { createServer } from 'aedes-server-factory';
import { startsWith, replace } from 'lodash';

import { Device } from '@app/modules/device/entities/device.entity';
import { DeviceService } from '@app/modules/device/services/device.service';

import { DeviceControlDto } from './dto/device-control.dto';
import { IMqttPublisher } from './interfaces/mqtt-publisher.interface';
import { MqttHandlerService } from './services/mqtt-handler.service';
import { MqttPublisherService } from './services/mqtt-publisher.service';

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

    private async startServer() {
        const port = this.configService.get<number>('mqtt.port');
        const wsPort = this.configService.get<number>('mqtt.wsPort');

        // TCP MQTT server
        this.server = createServer(this.broker);
        this.server.listen(port, () => {
            this.logger.log(`MQTT server is running on port ${port}`);
        });

        // WebSocket MQTT server
        this.wsServer = createServer(this.broker, { ws: true });
        this.wsServer.listen(wsPort, () => {
            this.logger.log(`MQTT WebSocket server is running on port ${wsPort}`);
        });
    }

    private setupBroker() {
        this.broker = createBroker({
            id: 'smart-home-broker',
        });

        this.mqttPublisher.setBroker(this.broker);
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        // Client connected
        this.broker.on('client', (client) => {
            this.logger.log(`Client connected: ${client.id}`);

            if (startsWith(client.id, 'device_')) {
                const deviceId = replace(client.id, 'device_', '');

                this.updateDeviceConnection(deviceId, true);
            }
        });

        // Client disconnected
        this.broker.on('clientDisconnect', (client) => {
            this.logger.log(`Client disconnected: ${client.id}`);

            if (startsWith(client.id, 'device_')) {
                const deviceId = replace(client.id, 'device_', '');

                this.updateDeviceConnection(deviceId, false);
            }
        });

        // Subscribe
        this.broker.on('subscribe', (subscriptions, client) => {
            this.logger.debug(`Client ${client.id} subscribed to: ${JSON.stringify(subscriptions)}`);
        });

        // Publish
        this.broker.on('publish', async (packet, client) => {
            if (!client) return;

            try {
                const topic = packet.topic;
                const message = packet.payload.toString();
                const payload = JSON.parse(message);

                await this.mqttHandler.handleMessage(topic, payload, client.id);
            } catch (error) {
                this.logger.error(`Error processing message: ${error.message}`);
            }
        });

        // Authentication
        this.broker.authenticate = (client, username, password, callback) => {
            const mqttUsername = this.configService.get<string>('mqtt.username');
            const mqttPassword = this.configService.get<string>('mqtt.password');

            const isAuthenticated =
                (!mqttUsername && !mqttPassword) ||
                (username === mqttUsername && password?.toString() === mqttPassword);

            if (isAuthenticated) {
                this.logger.debug(`Client ${client.id} authenticated`);
                callback(null, true);
            } else {
                this.logger.warn(`Client ${client.id} authentication failed`);

                const authError: IAuthenticateError = {
                    name: 'AuthenticateError',
                    message: 'Authentication failed',
                    returnCode: 4,
                };

                callback(authError, false);
            }
        };
    }

    private async updateDeviceConnection(deviceId: string, isConnected: boolean) {
        try {
            const device = await this.deviceService.findOne({ where: { id: deviceId } });

            if (!device) {
                this.logger.warn(`Device not found for connection update: ${deviceId}`);

                return;
            }

            device.isConnected = isConnected;
            device.lastSeenAt = new Date();

            if (!isConnected) {
                device.isOnline = false;
            }

            await device.save();
            this.logger.debug(`Updated device ${deviceId} connection status: ${isConnected}`);
        } catch (error) {
            this.logger.error(`Error updating device connection: ${error.message}`);
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

    async publishControl(deviceId: string, command: DeviceControlDto): Promise<void> {
        await this.publishToDevice(deviceId, 'control', command);
    }
}
