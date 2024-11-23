import { Injectable, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { split } from 'lodash';

import { Device } from '@app/modules/device/entities/device.entity';
import { DeviceService } from '@app/modules/device/services/device.service';

import { MqttPublisherService } from './mqtt-publisher.service';
import { DeviceControlDto, DeviceControlTypeEnum } from '../dto/device-control.dto';

@Injectable()
export class MqttHandlerService {
    private readonly logger = new Logger(MqttHandlerService.name);

    constructor(
        private readonly deviceService: DeviceService,
        private readonly mqttPublisher: MqttPublisherService,
    ) {}

    async handleMessage(topic: string, message: any, clientId: string): Promise<void> {
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

    private async handleDeviceStatus(deviceId: string, message: any): Promise<void> {
        try {
            const device = await this.deviceService.findOne({ where: { id: deviceId } });

            if (!device) {
                this.logger.warn(`Device not found: ${deviceId}`);

                return;
            }

            // Update device status
            device.isOnline = true;
            device.isConnected = true;
            device.lastSeenAt = new Date();

            if (message.value !== undefined) {
                device.value = message.value;
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

    private async handleDeviceData(deviceId: string, message: any): Promise<void> {
        try {
            const { value } = message;

            await this.deviceService.update(deviceId, { value });
            this.logger.log(`Updated device ${deviceId} data: ${value}`);
        } catch (error) {
            this.logger.error(`Error updating device data: ${error.message}`);
        }
    }

    async handleDeviceControl(deviceId: string, payload: any): Promise<Device> {
        this.logger.debug(`Processing control command: ${JSON.stringify(payload)}`);

        try {
            // Validate payload using DTO
            const controlDto = plainToClass(DeviceControlDto, payload);

            await validateOrReject(controlDto);

            // Get device
            const device = await this.deviceService.findById(deviceId);

            if (!device) {
                throw new Error(`Device not found: ${deviceId}`);
            }

            // Update device based on control type
            switch (controlDto.type) {
                case DeviceControlTypeEnum.SET_STATUS:
                    device.status = Boolean(controlDto.value);
                    this.logger.debug(`Setting device ${deviceId} status to ${device.status}`);
                    break;
                case DeviceControlTypeEnum.SET_VALUE:
                    device.value = Number(controlDto.value);
                    this.logger.debug(`Setting device ${deviceId} value to ${device.value}`);
                    break;
                case DeviceControlTypeEnum.SET_BRIGHTNESS:
                    device.brightness = Number(controlDto.value);
                    this.logger.debug(`Setting device ${deviceId} brightness to ${device.brightness}`);
                    break;
                case DeviceControlTypeEnum.SET_TEMPERATURE:
                    device.temperature = Number(controlDto.value);
                    console.log(`Setting device ${deviceId} temperature to ${device.temperature}`);
                    break;
                case DeviceControlTypeEnum.GET_INFO:
                    this.logger.debug(`Getting device ${deviceId} info`);

                    // Publish device info back to client
                    await this.mqttPublisher.publishToDevice(deviceId, 'data', {
                        type: 'device_info',
                        deviceId: device.id,
                        name: device.name,
                        status: device.status,
                        value: device.value,
                        brightness: device.brightness,
                        temperature: device.temperature,
                        isOnline: device.isOnline,
                        isConnected: device.isConnected,
                        lastSeenAt: device.lastSeenAt,
                        timestamp: new Date().toISOString(),
                    });

                    return device;
                default:
                    throw new Error(`Unsupported control type: ${controlDto.type}`);
            }

            // Save device changes
            await device.save();
            this.logger.debug(`Device ${deviceId} updated successfully`);

            return device;
        } catch (error) {
            this.logger.error(`Error in handleDeviceControl: ${error.message}`);
            throw error;
        }
    }
}
