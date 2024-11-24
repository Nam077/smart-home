import * as fs from 'fs';

import { Injectable, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { split, map, values } from 'lodash';

import { Device } from '@app/modules/device/entities/device.entity';
import { DeviceService } from '@app/modules/device/services/device.service';

import { MqttPublisherService } from './mqtt-publisher.service';
import {
    DeviceStatusControlDto,
    DeviceValueControlDto,
    DeviceBrightnessControlDto,
    DeviceTemperatureControlDto,
    DeviceSpeedControlDto,
    DeviceConfigControlDto,
    DeviceStatusResponseDto,
} from '../dto/device-control.dto';
import { TopicTypeEnum, CommandTypeEnum, ICommandMessage, IStatusMessage, IConfigMessage } from '../types/mqtt.types';

@Injectable()
export class MqttHandlerService {
    private readonly logger = new Logger(MqttHandlerService.name);

    constructor(
        private readonly deviceService: DeviceService,
        private readonly mqttPublisher: MqttPublisherService,
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
            if (message.brightness !== undefined) device.brightness = message.brightness;
            if (message.speed !== undefined) device.speed = message.speed;
            if (message.temperature !== undefined) device.temperature = message.temperature;
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

    // eslint-disable-next-line sonarjs/cognitive-complexity
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

                        await this.mqttPublisher.publishToDevice(roomId, device.id, CommandTypeEnum.SET_STATUS, {
                            status: true,
                            timestamp: now.toISOString(),
                        });
                    }

                    break;

                case CommandTypeEnum.TURN_OFF_ALL:
                    for (const device of devices) {
                        device.status = false;
                        device.lastSeenAt = now;
                        await device.save();

                        await this.mqttPublisher.publishToDevice(roomId, device.id, CommandTypeEnum.SET_STATUS, {
                            status: false,
                            timestamp: now.toISOString(),
                        });
                    }

                    break;

                case CommandTypeEnum.SET_BRIGHTNESS: {
                    const brightness = Math.max(0, Math.min(100, Number(message.value)));

                    for (const device of devices) {
                        if (device.brightness !== undefined) {
                            device.brightness = brightness;
                            device.lastSeenAt = now;
                            await device.save();

                            await this.mqttPublisher.publishToDevice(
                                roomId,
                                device.id,
                                CommandTypeEnum.SET_BRIGHTNESS,
                                {
                                    value: brightness,
                                    timestamp: now.toISOString(),
                                },
                            );
                        }
                    }

                    break;
                }

                case CommandTypeEnum.SET_SPEED: {
                    const speed = Math.max(0, Math.min(100, Number(message.value)));

                    for (const device of devices) {
                        if (device.speed !== undefined) {
                            device.speed = speed;
                            device.lastSeenAt = now;
                            await device.save();

                            await this.mqttPublisher.publishToDevice(roomId, device.id, CommandTypeEnum.SET_SPEED, {
                                value: speed,
                                timestamp: now.toISOString(),
                            });
                        }
                    }

                    break;
                }

                case CommandTypeEnum.SET_TEMPERATURE: {
                    const temperature = Number(message.value);

                    for (const device of devices) {
                        if (device.temperature !== undefined) {
                            device.temperature = temperature;
                            device.lastSeenAt = now;
                            await device.save();

                            await this.mqttPublisher.publishToDevice(
                                roomId,
                                device.id,
                                CommandTypeEnum.SET_TEMPERATURE,
                                {
                                    value: temperature,
                                    timestamp: now.toISOString(),
                                },
                            );
                        }
                    }

                    break;
                }

                case CommandTypeEnum.SET_VALUE: {
                    const value = Number(message.value);

                    for (const device of devices) {
                        if (device.value !== undefined) {
                            device.value = value;
                            device.lastSeenAt = now;
                            await device.save();

                            await this.mqttPublisher.publishToDevice(roomId, device.id, CommandTypeEnum.SET_VALUE, {
                                value: value,
                                timestamp: now.toISOString(),
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

    async handleDeviceControl(deviceId: string, payload: ICommandMessage): Promise<Device> {
        this.logger.debug(`Processing control command: ${JSON.stringify(payload)}`);

        fs.appendFile('control.log', `${JSON.stringify(payload)}\n`, (err) => {
            if (err) console.error(err);
        });
        let device: Device | null = null;

        try {
            device = await this.deviceService.findOne({ where: { id: deviceId }, relations: ['room'] });

            if (!device) {
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

                case CommandTypeEnum.SET_BRIGHTNESS:
                    dto = plainToClass(DeviceBrightnessControlDto, {
                        ...payload,
                        deviceId,
                        roomId: device.room.id,
                        value: Number(payload.value),
                    });
                    device.brightness = Math.max(0, Math.min(100, Number(dto.value)));
                    device.lastSeenAt = now;
                    break;

                case CommandTypeEnum.SET_TEMPERATURE:
                    dto = plainToClass(DeviceTemperatureControlDto, {
                        ...payload,
                        deviceId,
                        roomId: device.room.id,
                        value: Number(payload.value),
                    });
                    device.temperature = Number(dto.value);
                    device.lastSeenAt = now;
                    break;

                case CommandTypeEnum.SET_SPEED:
                    dto = plainToClass(DeviceSpeedControlDto, {
                        ...payload,
                        deviceId,
                        roomId: device.room.id,
                        value: Number(payload.value),
                    });
                    device.speed = Math.max(0, Math.min(100, Number(dto.value)));
                    device.lastSeenAt = now;
                    break;

                case CommandTypeEnum.UPDATE_CONFIG:
                    dto = plainToClass(DeviceConfigControlDto, payload);
                    device.config = {
                        ...device.config,
                        ...dto.value,
                        updatedAt: now,
                    };

                    if (dto.value.updateInterval) {
                        device.config.updateInterval = Math.max(1000, Number(dto.value.updateInterval));
                    }

                    if (dto.value.threshold !== undefined) {
                        device.config.threshold = Number(dto.value.threshold);
                    }

                    break;

                case CommandTypeEnum.GET_INFO: {
                    // Send back current device state
                    const deviceInfo = {
                        command: CommandTypeEnum.GET_INFO,
                        deviceId: device.id,
                        roomId: device.room.id,
                        status: device.status,
                        value: device.value,
                        brightness: device.brightness,
                        temperature: device.temperature,
                        isOnline: device.isOnline,
                        lastSeenAt: device.lastSeenAt,
                        timestamp: now.toISOString(),
                    };

                    // Publish device info on the status topic
                    await this.mqttPublisher.publish({
                        topic: `home/${device.room.id}/${deviceId}/status`,
                        payload: JSON.stringify(deviceInfo),
                        qos: 0,
                        retain: false,
                    });
                    break;
                }

                case CommandTypeEnum.GET_STATUS:
                    // Just return current device state
                    break;

                case CommandTypeEnum.SYNC_TIME:
                    device.config = {
                        serverTime: now.toISOString(),
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        timestamp: now.toISOString(),
                    };
                    break;

                case CommandTypeEnum.TURN_ON_ALL:
                case CommandTypeEnum.TURN_OFF_ALL:
                    // These are broadcast commands, should be handled by handleBroadcast
                    throw new Error(`Broadcast command ${payload.command} cannot be handled by device control`);

                case CommandTypeEnum.DEVICE_CONNECT: {
                    console.log(`Device ${deviceId} connected`);
                    console.log('Before update:', { isOnline: device.isOnline, isConnected: device.isConnected });

                    device.isOnline = true;
                    device.lastSeenAt = now;
                    await device.save();

                    // Verify after save
                    const updatedDevice = await this.deviceService.findById(deviceId);

                    console.log('After update:', {
                        isOnline: updatedDevice.isOnline,
                        isConnected: updatedDevice.isConnected,
                    });

                    // Gửi device info để cập nhật UI
                    const deviceInfo = {
                        status: device.status,
                        value: device.value,
                        brightness: device.brightness,
                        temperature: device.temperature,
                        isOnline: device.isOnline,
                        lastSeenAt: device.lastSeenAt,
                        timestamp: now.toISOString(),
                    };

                    console.log('Device info to send:', deviceInfo);

                    await this.mqttPublisher.publish({
                        topic: `home/${device.room.id}/${deviceId}/status`,
                        payload: JSON.stringify(deviceInfo),
                        qos: 0,
                        retain: false,
                    });

                    return device;
                }

                case CommandTypeEnum.DEVICE_DISCONNECT:
                    device.isOnline = false;
                    device.lastSeenAt = now;
                    await device.save();

                    return device;

                default: {
                    // This ensures we handle all cases in CommandTypeEnum
                    const exhaustiveCheck: never = payload.command;

                    throw new Error(`Unsupported command: ${exhaustiveCheck}`);
                }
            }

            if (dto) {
                try {
                    await validateOrReject(dto);
                } catch (validationErrors) {
                    const errors = map(validationErrors, (error) => values(error.constraints)).flat();

                    throw new Error(`Validation failed: ${errors.join(', ')}`);
                }
            }

            // Chỉ cập nhật lastSeenAt, không tự động cập nhật isOnline và isConnected
            device.lastSeenAt = now;
            await device.save();

            // Return device status
            const response = plainToClass(DeviceStatusResponseDto, {
                status: device.status,
                value: device.value,
                brightness: device.brightness,
                temperature: device.temperature,
                humidity: device.humidity,
                speed: device.speed,
                isOnline: device.isOnline,
                isConnected: device.isConnected,
                config: device.config,
                lastErrorAt: device.lastErrorAt,
                lastSeenAt: device.lastSeenAt,
                updatedAt: device.updatedAt,
                unit: device.unit,
                location: device.location,
                manufacturer: device.manufacturer,
                model: device.model,
                serialNumber: device.serialNumber,
                firmwareVersion: device.firmwareVersion,
            });

            await this.mqttPublisher.publishToDevice(device.room.id, deviceId, CommandTypeEnum.SET_STATUS, response);

            this.logger.debug(`Device ${deviceId} updated successfully`);

            return device;
        } catch (error) {
            this.logger.error(`Error in handleDeviceControl: ${JSON.stringify(payload)}: ${error.message}`);

            if (device) {
                device.lastErrorAt = new Date();
                device.lastError = error.message;
                device.isConnected = false;
                await device.save();
            }

            throw error;
        }
    }
}
