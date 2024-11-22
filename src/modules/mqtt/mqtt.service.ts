import { Server } from 'net';
import { promisify } from 'util';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PublishPacket } from 'aedes';
import Aedes from 'aedes';
import { createBroker } from 'aedes';
import { createServer } from 'aedes-server-factory';
import { split, map, startsWith, includes, toLower, replace } from 'lodash';

import { Device } from '@app/modules/device/entities/device.entity';
import { DeviceService } from '@app/modules/device/services/device.service';

interface IAuthenticateError extends Error {
    returnCode: number; // Chỉ định mã lỗi MQTT
}

@Injectable()
export class MqttService implements OnModuleInit {
    private readonly logger = new Logger(MqttService.name);
    private broker: Aedes;
    private server: Server;
    private wsServer: Server;

    convertAllToBoolean = (value: any) => {
        if (typeof value === 'string') {
            const trueValues = ['true', 'on', '1', 't', 'y', 'yes'];
            const falseValues = ['false', 'off', '0', 'f', 'n', 'no'];

            if (includes(falseValues, toLower(value))) return false;
            else if (includes(trueValues, toLower(value))) return true;
            else return value;
        }

        return value;
    };

    constructor(
        private readonly configService: ConfigService,
        private readonly deviceService: DeviceService,
    ) {
        this.broker = createBroker(); // Khởi tạo Aedes instance
        this.setupEventHandlers(); // Thiết lập các event
    }

    async onModuleInit() {
        await this.startServer(); // Khởi động server
    }

    private async startServer() {
        const port = this.configService.get<number>('mqtt.port');
        const wsPort = this.configService.get<number>('mqtt.wsPort');

        // Khởi tạo TCP MQTT server
        this.server = createServer(this.broker); // Truyền trực tiếp Aedes instance
        this.server.listen(port, () => {
            this.logger.log(`MQTT server is running on port ${port}`);
        });

        // Khởi tạo WebSocket MQTT server
        this.wsServer = createServer(this.broker, { ws: true }); // Tương tự cho WebSocket
        this.wsServer.listen(wsPort, () => {
            this.logger.log(`MQTT WebSocket server is running on port ${wsPort}`);
        });
    }

    private setupEventHandlers() {
        // Sự kiện khi client kết nối
        this.broker.on('client', async (client) => {
            this.logger.log(`Client connected: ${client?.id}`);

            // Kiểm tra nếu client ID là một device ID
            if (client?.id && startsWith(client.id, 'device_')) {
                const deviceId = replace(client.id, 'device_', '');

                await this.updateDeviceConnection(deviceId, true);
            }
        });

        // Sự kiện khi client ngắt kết nối
        this.broker.on('clientDisconnect', async (client) => {
            this.logger.log(`Client disconnected: ${client?.id}`);

            // Kiểm tra nếu client ID là một device ID
            if (client?.id && startsWith(client.id, 'device_')) {
                const deviceId = replace(client.id, 'device_', '');

                await this.updateDeviceConnection(deviceId, false);
            }
        });

        // Sự kiện khi client subscribe vào topic
        this.broker.on('subscribe', (subscriptions, client) => {
            this.logger.log(
                `Client ${client?.id} subscribed to topics: ${map(subscriptions, ({ topic }) => topic).join(', ')}`,
            );
        });

        // Sự kiện khi nhận message từ client
        this.broker.on('publish', async (packet, client) => {
            if (!client) return; // Bỏ qua các message nội bộ
            const topic = packet.topic;
            const payload = packet.payload.toString();

            this.logger.debug(`Received message on topic ${topic}: ${payload}`);

            try {
                // Kiểm tra payload có phải JSON không
                const isJSON = (str: string) => {
                    try {
                        JSON.parse(str);

                        return true;
                    } catch {
                        return false;
                    }
                };

                if (isJSON(payload)) {
                    const message = JSON.parse(payload);

                    await this.handleMessage(topic, message, client.id);
                } else {
                    this.logger.warn(`Non-JSON payload received: ${payload}`);
                }
            } catch (error) {
                this.logger.error(`Error handling message: ${error.message}`);
            }
        });

        // Xác thực client
        this.broker.authenticate = (client, username, password, callback) => {
            const mqttUsername = this.configService.get<string>('mqtt.username');
            const mqttPassword = this.configService.get<string>('mqtt.password');

            const isAuthenticated =
                (!mqttUsername && !mqttPassword) ||
                (username === mqttUsername && password?.toString() === mqttPassword);

            if (isAuthenticated) {
                this.logger.log(`Client ${client.id} authenticated successfully`);
                callback(null, true); // Xác thực thành công
            } else {
                this.logger.warn(`Client ${client.id} authentication failed`);

                // Tạo lỗi tùy chỉnh với returnCode
                const authError: IAuthenticateError = {
                    name: 'AuthenticateError',
                    message: 'Authentication failed',
                    returnCode: 4, // 4: Not authorized
                };

                callback(authError, false); // Trả về lỗi xác thực
            }
        };
    }

    private async handleMessage(topic: string, message: any, clientId: string) {
        console.log('handleMessage', topic, message, clientId);

        const topicParts = split(topic, '/');

        if (topicParts.length !== 3) {
            this.logger.warn(`Invalid topic format: ${topic}`);

            return;
        }

        const [prefix, deviceId, action] = topicParts;

        if (prefix !== 'device') {
            this.logger.warn(`Invalid topic prefix: ${prefix}`);

            return;
        }

        this.logger.debug(`Handling ${action} message for device ${deviceId}`);

        switch (action) {
            case 'status':
                await this.handleDeviceStatus(deviceId, message);
                break;
            case 'data':
                await this.handleDeviceData(deviceId, message);
                break;
            case 'control':
                await this.handleDeviceControl(deviceId, message);
                break;
            default:
                this.logger.warn(`Unknown action: ${action}`);
        }
    }

    private async handleDeviceStatus(deviceId: string, message: any) {
        try {
            const device = await this.deviceService.findOne({ where: { id: deviceId } });

            if (!device) {
                this.logger.warn(`Device not found: ${deviceId}`);

                return;
            }

            console.log(message);

            // Cập nhật trạng thái thiết bị
            device.isOnline = true;
            device.isConnected = true;
            device.lastSeenAt = new Date();

            if (message.status !== undefined) {
                device.status = message.status;
            }

            if (message.value !== undefined) {
                device.value = message.value;
            }

            if (message.unit !== undefined) {
                device.unit = message.unit;
            }

            if (message.error) {
                device.lastError = message.error;
            }

            await device.save();
            this.logger.log(`Updated device ${deviceId} status: ${JSON.stringify(message)}`);
        } catch (error) {
            this.logger.error(`Error updating device status: ${error.message}`);
        }
    }

    private async handleDeviceData(deviceId: string, message: any) {
        try {
            const { value, unit } = message;

            await this.deviceService.update(deviceId, { value, unit });
            this.logger.log(`Updated device ${deviceId} data: ${value} ${unit}`);
        } catch (error) {
            this.logger.error(`Error updating device data: ${error.message}`);
        }
    }

    // Xử lý lệnh điều khiển thiết bị
    async handleDeviceControl(deviceId: string, payload: any) {
        this.logger.debug(`Xử lý lệnh: ${JSON.stringify(payload)}`);

        try {
            // Kiểm tra thiết bị
            const device = await this.deviceService.findById(deviceId);

            if (!device) {
                this.logger.error(`Không tìm thấy thiết bị: ${deviceId}`);

                return;
            }

            // Xử lý lệnh
            switch (payload.type) {
                case 'get_status':
                    await this.notifyDeviceStatus(device);

                    return;

                case 'set_status': {
                    const status = this.convertAllToBoolean(payload.status);

                    console.log('ok', status);

                    if (typeof status !== 'boolean') {
                        this.logger.error(`Giá trị status không hợp lệ: ${payload.status}`);

                        return;
                    }

                    device.status = status;
                    break;
                }

                case 'set_value': {
                    const value = Number(payload.value);

                    if (isNaN(value)) {
                        this.logger.error(`Giá trị value không hợp lệ: ${payload.value}`);

                        return;
                    }

                    device.value = value;
                    break;
                }

                case 'set_brightness': {
                    const brightness = Number(payload.brightness);

                    if (isNaN(brightness) || brightness < 0 || brightness > 100) {
                        this.logger.error(`Giá trị brightness không hợp lệ: ${payload.brightness}`);

                        return;
                    }

                    device.brightness = brightness;
                    break;
                }

                case 'set_temperature': {
                    const temperature = Number(payload.temperature);

                    if (isNaN(temperature)) {
                        this.logger.error(`Giá trị temperature không hợp lệ: ${payload.temperature}`);

                        return;
                    }

                    device.temperature = temperature;
                    break;
                }

                default:
                    this.logger.error(`Loại lệnh không hỗ trợ: ${payload.type}`);

                    return;
            }

            // Lưu thay đổi
            await device.save();
            this.logger.debug(`Đã cập nhật thiết bị ${deviceId}`);

            // Gửi trạng thái mới
            await this.notifyDeviceStatus(device);
        } catch (error) {
            this.logger.error(`Lỗi điều khiển thiết bị: ${error.message}`);
            throw error;
        }
    }

    // Gửi thông báo trạng thái thiết bị
    private async notifyDeviceStatus(device: Device): Promise<void> {
        try {
            // Lấy trạng thái mới nhất
            const currentDevice = await this.deviceService.findById(device.id);

            if (!currentDevice) {
                this.logger.error(`Không tìm thấy thiết bị: ${device.id}`);

                return;
            }

            // Tạo object trạng thái
            const status = {
                deviceId: currentDevice.id,
                isOnline: currentDevice.isOnline,
                isConnected: currentDevice.isConnected,
                lastSeenAt: currentDevice.lastSeenAt,
                status: currentDevice.status,
                brightness: currentDevice.brightness,
                temperature: currentDevice.temperature,
                value: currentDevice.value,
                unit: currentDevice.unit,
                name: currentDevice.name,
            };

            // Gửi trạng thái
            const topic = `device/${currentDevice.id}/status`;

            await this.publish(topic, status);

            this.logger.debug(`Đã gửi trạng thái: ${JSON.stringify(status)}`);
        } catch (error) {
            this.logger.error(`Lỗi gửi trạng thái: ${error.message}`);
        }
    }

    private async publish(topic: string, message: any): Promise<void> {
        const packet: PublishPacket = {
            cmd: 'publish' as const,
            topic,
            payload: Buffer.from(JSON.stringify(message)),
            qos: 1,
            dup: false,
            retain: false,
        };

        const publishAsync = promisify(this.broker.publish.bind(this.broker));

        await publishAsync(packet);
        this.logger.log(`Published message to ${topic}: ${JSON.stringify(message)}`);
    }

    private async updateDeviceConnection(deviceId: string, isConnected: boolean) {
        try {
            const device = await this.deviceService.findOne({ where: { id: deviceId } });

            if (!device) {
                this.logger.warn(`Device not found for connection update: ${deviceId}`);

                return;
            }

            // Cập nhật trạng thái kết nối
            device.isConnected = isConnected;
            device.isOnline = isConnected;
            device.lastSeenAt = new Date();

            if (!isConnected) {
                device.status = false; // Tắt thiết bị khi mất kết nối
            }

            await device.save();
            this.logger.log(`Updated device ${deviceId} connection status: ${isConnected}`);

            // Gửi trạng thái hiện tại cho device
            const currentState = {
                isConnected,
                isOnline: isConnected,
                status: device.status,
                brightness: device.brightness,
                value: device.value,
                unit: device.unit,
                temperature: device.temperature,
                lastSeenAt: device.lastSeenAt,
            };

            // Publish trạng thái mới với retain flag
            await this.publishStatus(deviceId, currentState);

            // Nếu thiết bị vừa kết nối, gửi lại lệnh điều khiển cuối cùng
            if (isConnected && device.status) {
                const controlMessage: any = {
                    power: device.status,
                };

                if (device.brightness !== undefined) {
                    controlMessage.brightness = device.brightness;
                }

                if (device.temperature !== undefined) {
                    controlMessage.temperature = device.temperature;
                }

                await this.publishControl(deviceId, controlMessage);
            }
        } catch (error) {
            this.logger.error(`Error updating device connection: ${error.message}`);
        }
    }

    private async publishStatus(deviceId: string, status: any) {
        const topic = `device/${deviceId}/status`;
        const message = JSON.stringify(status);

        const publishAsync = promisify(this.broker.publish.bind(this.broker));

        try {
            await publishAsync({
                cmd: 'publish',
                dup: false,
                qos: 1,
                retain: true, // Lưu lại trạng thái cuối cùng
                topic,
                payload: Buffer.from(message),
            });

            this.logger.debug(`Published status update for device ${deviceId}: ${message}`);
        } catch (error) {
            this.logger.error(`Error publishing status: ${error.message}`);
        }
    }

    // Phương thức gửi lệnh điều khiển đến thiết bị
    async publishControl(deviceId: string, command: any) {
        const topic = `device/${deviceId}/control`;
        const message = JSON.stringify(command);

        const publishAsync = promisify(this.broker.publish.bind(this.broker));

        try {
            await publishAsync({
                cmd: 'publish',
                dup: false,
                qos: 1,
                retain: false,
                topic,
                payload: Buffer.from(message),
            });

            this.logger.log(`Published control message to ${deviceId}: ${message}`);
        } catch (error) {
            this.logger.error(`Error publishing control message: ${error.message}`);
            throw error;
        }
    }
}
