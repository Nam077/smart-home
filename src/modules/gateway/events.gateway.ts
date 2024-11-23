import { Logger } from '@nestjs/common';
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { DeviceService } from '../device/services/device.service';
import { DeviceControlDto } from '../mqtt/dto/device-control.dto';
import { MqttService } from '../mqtt/mqtt.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(EventsGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly mqttService: MqttService,
        private readonly deviceService: DeviceService,
    ) {}

    // Handle client connection
    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    // Handle client disconnection
    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('device:control')
    async handleDeviceControl(client: Socket, payload: DeviceControlDto & { deviceId: string }) {
        try {
            const { deviceId, ...controlDto } = payload;

            this.logger.debug(`Received control command for device ${deviceId}: ${JSON.stringify(controlDto)}`);

            // Handle device control through MQTT service
            const device = await this.mqttService.handleDeviceControl(deviceId, controlDto);

            if (!device) {
                throw new Error(`Device not found: ${deviceId}`);
            }

            // Publish control message to MQTT
            await this.mqttService.publishToDevice(deviceId, 'control', controlDto);

            // Emit success event
            this.logger.debug(`Device control successful: ${JSON.stringify(device)}`);
            client.emit('device:control:success', {
                deviceId,
                ...controlDto,
                device,
            });
        } catch (error) {
            this.logger.error(`Error controlling device: ${error.message}`);
            client.emit('device:control:error', {
                deviceId: payload.deviceId,
                error: error.message,
            });
        }
    }

    @SubscribeMessage('device:info')
    async handleGetDeviceInfo(client: Socket, deviceId: string) {
        try {
            const device = await this.deviceService.findById(deviceId);

            if (!device) {
                throw new Error(`Device not found: ${deviceId}`);
            }

            client.emit('device:info', {
                deviceId,
                status: device.status,
                value: device.value,
                unit: device.unit,
                isOnline: device.isOnline,
                isConnected: device.isConnected,
                lastSeenAt: device.lastSeenAt,
                lastError: device.lastError,
            });
        } catch (error) {
            this.logger.error('Error getting device info:', error);
            client.emit('device:info:error', {
                deviceId,
                error: error.message,
            });
        }
    }

    @SubscribeMessage('device:subscribe')
    async handleDeviceSubscribe(client: Socket, deviceId: string) {
        try {
            const device = await this.deviceService.findById(deviceId);

            if (!device) {
                throw new Error(`Device not found: ${deviceId}`);
            }

            // Join device room
            client.join(`device:${deviceId}`);
            client.emit('device:subscribe:success', { deviceId });

            // Get initial device info
            const deviceData = {
                deviceId,
                status: device.status,
                value: device.value,
                unit: device.unit,
                isOnline: device.isOnline,
                isConnected: device.isConnected,
                lastSeenAt: device.lastSeenAt,
                lastError: device.lastError,
            };

            client.emit('device:info', deviceData);
        } catch (error) {
            this.logger.error('Error subscribing to device:', error);
            client.emit('device:subscribe:error', {
                deviceId,
                error: error.message,
            });
        }
    }

    @SubscribeMessage('device:unsubscribe')
    handleDeviceUnsubscribe(client: Socket, deviceId: string) {
        client.leave(`device:${deviceId}`);
        client.emit('device:unsubscribe:success', { deviceId });
    }

    // Broadcast device status update to all subscribed clients
    broadcastDeviceStatus(deviceId: string, status: any) {
        this.server.to(`device:${deviceId}`).emit('device:info', {
            deviceId,
            ...status,
        });
    }
}
