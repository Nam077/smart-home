import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { DeviceService } from '@app/modules/device/services/device.service';

import { MqttService } from '../mqtt.service';

@Injectable()
export class MqttHeartbeatService implements OnModuleInit {
    private readonly logger = new Logger(MqttHeartbeatService.name);
    private readonly offlineThreshold = 60000; // 1 minute

    constructor(
        private readonly deviceService: DeviceService,
        private readonly mqttService: MqttService,
    ) {}

    onModuleInit() {
        this.logger.log('MqttHeartbeatService initialized');
    }

    @Interval(30000) // Check every 30 seconds
    async checkDevicesHeartbeat() {
        try {
            const devices = await this.deviceService.findAll();

            for (const device of devices) {
                await this.checkDeviceHeartbeat(device.id);
            }
        } catch (error) {
            this.logger.error(`Error checking devices heartbeat: ${error.message}`);
        }
    }

    async checkDeviceHeartbeat(deviceId: string): Promise<void> {
        try {
            const device = await this.deviceService.findById(deviceId);

            if (!device) {
                this.logger.warn(`Device not found: ${deviceId}`);

                return;
            }

            const now = new Date();
            const lastSeen = device.lastSeenAt || new Date(0);
            const timeDiff = now.getTime() - lastSeen.getTime();

            if (timeDiff > this.offlineThreshold && device.isOnline) {
                this.logger.warn(`Device ${deviceId} appears to be offline`);

                // Update device status
                device.isOnline = false;
                device.isConnected = false;
                await device.save();

                // Send heartbeat request
                await this.mqttService.publishToDevice(deviceId, 'heartbeat', { timestamp: now.toISOString() });
            }
        } catch (error) {
            this.logger.error(`Error checking device ${deviceId} heartbeat: ${error.message}`);
        }
    }

    async handleHeartbeatResponse(deviceId: string, timestamp: string): Promise<void> {
        console.log('Heartbeat response received:', deviceId, timestamp);

        try {
            const device = await this.deviceService.findById(deviceId);

            if (!device) {
                this.logger.warn(`Device not found: ${deviceId}`);

                return;
            }

            device.lastSeenAt = new Date();
            await device.save();

            this.logger.debug(`Updated heartbeat for device ${deviceId}`);
        } catch (error) {
            this.logger.error(`Error handling heartbeat response for device ${deviceId}: ${error.message}`);
        }
    }
}
