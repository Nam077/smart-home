import * as fs from 'fs';

import { Injectable, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { split, map, values } from 'lodash';

import { Device } from '@app/modules/device/entities/device.entity';
import { DeviceService } from '@app/modules/device/services/device.service';
import { User } from '@app/modules/user/entities/user.entity';

import { MqttHeartbeatService } from './mqtt-heartbeat.service';
import { DeviceStatusControlDto, DeviceValueControlDto } from '../dto/device-control.dto';
import { TopicTypeEnum, CommandTypeEnum, ICommandMessage, IStatusMessage, IConfigMessage } from '../types/mqtt.types';
import { MqttPublisherService } from '@app/modules/global/services/mqtt-publisher.service';

@Injectable()
export class MqttHandlerService {
    private readonly logger = new Logger(MqttHandlerService.name);

    constructor(
        private readonly deviceService: DeviceService,
        private readonly mqttPublisher: MqttPublisherService,
        private readonly mqttHeartbeat: MqttHeartbeatService,
    ) {}

    async handleMessage(topic: string, message: any, clientId: string): Promise<void> {
        console.log(`Received message on topic ${topic} from client ${clientId}: ${JSON.stringify(message)}`);

        const topicParts = split(topic, '/');

        // Format: home/{roomId}/{deviceId?}/{type}
        if (topicParts.length < 3 || topicParts.length > 4) {
            this.logger.warn(`Invalid topic format: ${topic}`);

            return;
        }

        const [prefix, roomId, ...rest] = topicParts;
        const type = rest[rest.length - 1] as TopicTypeEnum;
        const deviceId = rest.length === 2 ? rest[0] : null;

        if (prefix !== 'home') {
            this.logger.warn(`Invalid topic prefix: ${prefix}`);

            return;
        }

        this.logger.debug(`Handling ${type} message for room ${roomId}${deviceId ? ` device ${deviceId}` : ''}`);

        try {
            switch (type) {
                case TopicTypeEnum.STATUS:
                    if (!deviceId) {
                        throw new Error('Device ID is required for status messages');
                    }

                    await this.handleDeviceStatus(roomId, deviceId, message as IStatusMessage);
                    break;

                case TopicTypeEnum.CONTROL:
                    if (!deviceId) {
                        throw new Error('Device ID is required for control messages');
                    }

                    await this.handleDeviceControl(deviceId, message as ICommandMessage);
                    break;

                case TopicTypeEnum.BROADCAST:
                    await this.handleBroadcast(roomId, message as ICommandMessage);
                    break;

                case TopicTypeEnum.CONFIG:
                    await this.handleConfig(roomId, message as IConfigMessage);
                    break;

                default:
                    this.logger.warn(`Unsupported topic type: ${type}`);
            }
        } catch (error) {
            this.logger.error(`Error handling message: ${error.message}`);
        }
    }

    private async handleDeviceStatus(roomId: string, deviceId: string, message: IStatusMessage): Promise<void> {
        try {
            const device = await this.deviceService.findOne({ where: { id: deviceId } });

            if (!device) {
                throw new Error(`Device not found: ${deviceId}`);
            }

            // Update device status
            device.status = Boolean(message.status) || device.status;
            if (message.value !== undefined) device.value = message.value;

            if (message.error) {
                device.lastErrorAt = new Date();
            }

            await device.save();

            this.logger.debug(`Updated status for device ${deviceId}: ${JSON.stringify(message)}`);
        } catch (error) {
            this.logger.error(`Error handling device status: ${error.message}`);
        }
    }

    private async handleBroadcast(roomId: string, message: ICommandMessage): Promise<void> {
        try {
            const devices = await this.deviceService.findByRoomId(roomId);
            const now = new Date();

            switch (message.command) {
                case CommandTypeEnum.TURN_ON_ALL:
                    for (const device of devices) {
                        device.status = true;
                        device.lastSeenAt = now;
                        await device.save();

                        // Publish status update
                        await this.mqttPublisher.publish({
                            topic: `home/${roomId}/${device.id}/${device.type}/status`,
                            payload: JSON.stringify({
                                deviceId: device.id,
                                status: true,
                                isOnline: device.isOnline,
                                isConnected: device.isConnected,
                                lastSeenAt: device.lastSeenAt,
                                timestamp: now.toISOString(),
                            }),
                            qos: 1,
                            retain: false,
                        });
                    }

                    break;

                case CommandTypeEnum.TURN_OFF_ALL:
                    for (const device of devices) {
                        device.status = false;
                        device.lastSeenAt = now;
                        await device.save();

                        // Publish status update
                        await this.mqttPublisher.publish({
                            topic: `home/${roomId}/${device.id}/${device.type}/status`,
                            payload: JSON.stringify({
                                deviceId: device.id,
                                status: false,
                                isOnline: device.isOnline,
                                isConnected: device.isConnected,
                                lastSeenAt: device.lastSeenAt,
                                timestamp: now.toISOString(),
                            }),
                            qos: 1,
                            retain: false,
                        });
                    }

                    break;

                case CommandTypeEnum.SET_VALUE: {
                    const value = Number(message.value);

                    for (const device of devices) {
                        if (device.value !== undefined) {
                            device.value = value;
                            device.lastSeenAt = now;
                            await device.save();

                            // Publish status update
                            await this.mqttPublisher.publish({
                                topic: `home/${roomId}/${device.id}/${device.type}/status`,
                                payload: JSON.stringify({
                                    deviceId: device.id,
                                    value: value,
                                    isOnline: device.isOnline,
                                    isConnected: device.isConnected,
                                    lastSeenAt: device.lastSeenAt,
                                    timestamp: now.toISOString(),
                                }),
                                qos: 1,
                                retain: false,
                            });
                        }
                    }

                    break;
                }

                case CommandTypeEnum.SYNC_TIME: {
                    const timeConfig = {
                        serverTime: now.toISOString(),
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        timestamp: now.toISOString(),
                    };

                    for (const device of devices) {
                        device.config = {
                            ...device.config,
                            ...timeConfig,
                        };
                        device.lastSeenAt = now;
                        await device.save();

                        await this.mqttPublisher.publishToDevice(
                            roomId,
                            device.id,
                            CommandTypeEnum.SYNC_TIME,
                            timeConfig,
                        );
                    }

                    break;
                }

                default:
                    // For other commands, just broadcast as is
                    for (const device of devices) {
                        await this.mqttPublisher.publishToDevice(roomId, device.id, message.command, {
                            ...message.value,
                            timestamp: now.toISOString(),
                        });
                    }
            }

            this.logger.debug(`Broadcast command ${message.command} to ${devices.length} devices in room ${roomId}`);
        } catch (error) {
            this.logger.error(`Error handling broadcast: ${error.message}`);
            throw error;
        }
    }

    private async handleConfig(roomId: string, message: IConfigMessage): Promise<void> {
        try {
            const devices = await this.deviceService.findByRoomId(roomId);

            for (const device of devices) {
                device.config = {
                    ...device.config,
                    ...message,
                };
                await device.save();
            }

            this.logger.debug(`Updated config for room ${roomId}: ${JSON.stringify(message)}`);
        } catch (error) {
            this.logger.error(`Error handling config: ${error.message}`);
        }
    }

    // Thêm helper method để format log messages
    private formatLogMessage(action: string, details: Record<string, any>): string {
        return `[${action}] ${JSON.stringify(details, null, 2)}`;
    }

    private async publishDeviceStatus(device: Device, changedFields: Record<string, any>) {
        try {
            // Chỉ gửi các trường đã thay đổi và một số trường bắt buộc
            const statusMessage = {
                deviceId: device.id,
                timestamp: new Date().toISOString(),
                ...changedFields,
            };

            await this.mqttPublisher.publish({
                topic: `home/${device.room.id}/${device.id}/status`,
                payload: JSON.stringify(statusMessage),
                qos: 1,
                retain: false,
            });

            this.logger.debug(
                this.formatLogMessage('STATUS_PUBLISHED', {
                    deviceId: device.id,
                    changedFields: Object.keys(changedFields),
                    status: statusMessage,
                }),
            );
        } catch (error) {
            this.logger.error(
                this.formatLogMessage('PUBLISH_STATUS_ERROR', {
                    deviceId: device.id,
                    error: error.message,
                }),
            );
        }
    }

    async handleDeviceControl(deviceId: string, payload: ICommandMessage): Promise<Device> {
        this.logger.debug(`Processing control command: ${JSON.stringify(payload)}`);

        fs.appendFile('control.log', `${JSON.stringify(payload)}\n`, (err) => {
            if (err) console.error(err);
        });

        let device: Device | null = null;

        try {
            // Tìm thiết bị theo deviceId
            device = await this.deviceService.findOne({ where: { id: deviceId }, relations: ['room'] });

            if (!device) {
                this.logger.error(`Device not found: ${deviceId}`);
                throw new Error(`Device not found: ${deviceId}`);
            }

            if (!payload || !payload.command) {
                throw new Error(`Invalid control message: ${JSON.stringify(payload)}`);
            }

            let dto;
            const now = new Date();

            switch (payload.command) {
                case CommandTypeEnum.SET_STATUS:
                    dto = plainToClass(DeviceStatusControlDto, {
                        ...payload,
                        deviceId,
                        roomId: device.room.id,
                        value: payload.value === 'toggle' ? !device.status : Boolean(payload.value),
                    });

                    device.status = Boolean(dto.value);
                    device.lastSeenAt = now;
                    break;

                case CommandTypeEnum.SET_VALUE:
                    dto = plainToClass(DeviceValueControlDto, {
                        ...payload,
                        deviceId,
                        roomId: device.room.id,
                        value: Number(payload.value),
                    });

                    device.value = Number(dto.value);
                    device.lastSeenAt = now;
                    break;

                case CommandTypeEnum.UPDATE_CONFIG:
                    const newConfig = {
                        ...device.config,
                        ...payload.value,
                        updatedAt: now,
                    };

                    if (JSON.stringify(device.config) !== JSON.stringify(newConfig)) {
                        device.config = newConfig;
                    }

                    break;
            }

            if (dto) {
                try {
                    await validateOrReject(dto);
                } catch (validationErrors) {
                    const errors = map(validationErrors, (error) => values(error.constraints)).flat();

                    throw new Error(`Validation failed: ${errors.join(', ')}`);
                }
            }

            device.lastSeenAt = now;
            await device.save();

            // Chuẩn bị message trạng thái và gửi lên MQTT
            const statusMessage = {
                deviceId: device.id,
                status: device.status,
                value: device.value,
                isOnline: device.isOnline,
                isConnected: device.isConnected,
                config: device.config,
                lastErrorAt: device.lastErrorAt,
                lastSeenAt: device.lastSeenAt,
                updatedAt: device.updatedAt,
                unit: device.unit,
                manufacturer: device.manufacturer,
                model: device.model,
                serialNumber: device.serialNumber,
                firmwareVersion: device.firmwareVersion,
                timestamp: now.toISOString(),
            };

            await this.mqttPublisher.publish({
                topic: `home/${device.room.id}/${deviceId}/status`,
                payload: JSON.stringify(statusMessage),
                qos: 1,
                retain: false,
            });

            return device;
        } catch (error) {
            this.logger.error(
                this.formatLogMessage('CONTROL_ERROR', {
                    deviceId,
                    command: payload.command,
                    error: error.message,
                }),
            );

            if (device) {
                device.lastErrorAt = new Date();
                device.lastError = error.message;
                device.isConnected = false;
                await device.save();
                await this.mqttHeartbeat.untrackDevice(deviceId);
            }

            throw error;
        }
    }

    private async handleDeviceInfoRequest(roomId: string, deviceId: string): Promise<void> {
        try {
            // Tìm thiết bị theo deviceId
            const device = await this.deviceService.findOne({ where: { id: deviceId }, relations: ['room'] });

            if (!device) {
                this.logger.warn(`Device not found: ${deviceId}`);

                return;
            }

            // Chuẩn bị payload chứa thông tin thiết bị
            const deviceInfo = {
                deviceId: device.id,
                roomId: device.room.id,
                status: device.status,
                value: device.value,
                config: device.config,
                isConnected: device.isConnected,
                lastSeenAt: device.lastSeenAt?.toISOString(),
                unit: device.unit,
                manufacturer: device.manufacturer,
                model: device.model,
                serialNumber: device.serialNumber,
                firmwareVersion: device.firmwareVersion,
                timestamp: new Date().toISOString(),
            };

            // Gửi thông tin qua MQTT tới ESP
            await this.mqttPublisher.publish({
                topic: `home/${roomId}/${deviceId}/info`,
                payload: JSON.stringify(deviceInfo),
                qos: 1,
                retain: false,
            });

            this.logger.debug(
                this.formatLogMessage('DEVICE_INFO_SENT', {
                    deviceId,
                    roomId,
                    topic: `home/${roomId}/${deviceId}/info`,
                    info: deviceInfo,
                }),
            );
        } catch (error) {
            this.logger.error(
                this.formatLogMessage('DEVICE_INFO_ERROR', {
                    deviceId,
                    roomId,
                    error: error.message,
                }),
            );
            throw error;
        }
    }

    private async handleRequestDeviceList(controllerId: string, user: User, payload: ICommandMessage): Promise<void> {
        this.logger.debug(`Processing control command: ${JSON.stringify(payload)}`);

        fs.appendFile('control.log', `${JSON.stringify(payload)}\n`, (err) => {
            if (err) console.error(err);
        });

        try {
            // Kiểm tra controllerId và user
            if (!controllerId) {
                throw new Error('Controller ID is required for device list request');
            }

            if (!user) {
                throw new Error('User information is required for device list request');
            }

            // Lấy danh sách thiết bị theo controllerId và user
            const devices = await this.deviceService.findByControllerId(controllerId, user);

            if (!devices || devices.length === 0) {
                this.logger.warn(`No devices found for controller: ${controllerId} and user: ${user.id}`);

                return;
            }

            // Tạo payload chứa danh sách thiết bị
            const deviceList = devices.map((device) => ({
                id: device.id,
                name: device.name,
                type: device.type,
                status: device.status,
                value: device.value,
                isConnected: device.isConnected,
                lastSeenAt: device.lastSeenAt?.toISOString(),
            }));

            const payload = {
                controllerId,
                devices: deviceList,
                timestamp: new Date().toISOString(),
            };

            // Gửi danh sách thiết bị qua MQTT
            await this.mqttPublisher.publish({
                topic: `home/${controllerId}/response/devices`,
                payload: JSON.stringify(payload),
                qos: 1,
                retain: false,
            });

            this.logger.debug(
                this.formatLogMessage('DEVICE_LIST_RESPONSE_SENT', {
                    controllerId,
                    userId: user.id,
                    devices: deviceList,
                }),
            );
        } catch (error) {
            this.logger.error(
                this.formatLogMessage('DEVICE_LIST_RESPONSE_ERROR', {
                    controllerId,
                    userId: user.id,
                    error: error.message,
                }),
            );
        }
    }
}
