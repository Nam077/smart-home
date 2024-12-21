import { MqttPublisherService } from '@app/modules/global/services/mqtt-publisher.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';


interface DeviceInfo {
    lastSeen: Date;
    roomId: string;
    isOnline: boolean;
    isConnected: boolean;
}

@Injectable()
export class MqttHeartbeatService implements OnModuleInit {
    private readonly logger = new Logger(MqttHeartbeatService.name);
    private readonly offlineThreshold = 60000; // 1 minute
    private readonly batchSize = 50;
    private activeDevices: Map<string, DeviceInfo> = new Map();

    constructor(private readonly mqttPublisher: MqttPublisherService) {}

    async trackDevice(deviceId: string, roomId: string) {
        this.activeDevices.set(deviceId, {
            lastSeen: new Date(),
            roomId,
            isOnline: true,
            isConnected: true,
        });
    }

    async untrackDevice(deviceId: string) {
        this.activeDevices.delete(deviceId);
    }

    @Interval(3000) // Check every 30 seconds
    async checkDevicesHeartbeat() {
        try {
            const now = new Date();
            const devicesToCheck: string[] = [];

            // Chỉ check các devices đang active
            this.activeDevices.forEach((lastSeen, deviceId) => {
                const timeDiff = now.getTime() - lastSeen.lastSeen.getTime();

                if (timeDiff > this.offlineThreshold) {
                    devicesToCheck.push(deviceId);
                }
            });

            // Xử lý theo batch
            for (let i = 0; i < devicesToCheck.length; i += this.batchSize) {
                const batch = devicesToCheck.slice(i, i + this.batchSize);

                await Promise.all(batch.map((deviceId) => this.checkDeviceHeartbeat(deviceId)));
            }

            this.logger.debug(`Checked heartbeat for ${devicesToCheck.length} devices`);
        } catch (error) {
            this.logger.error(`Error checking devices heartbeat: ${error.message}`);
        }
    }

    async checkDeviceHeartbeat(deviceId: string): Promise<void> {
        try {
            const deviceInfo = this.activeDevices.get(deviceId);

            if (!deviceInfo) return;

            const now = new Date();

            this.logger.warn(`Device ${deviceId} appears to be offline`);

            // Update device info in map
            deviceInfo.isOnline = false;
            deviceInfo.isConnected = false;
            deviceInfo.lastSeen = now;

            // Publish status update
            await this.mqttPublisher.publish({
                topic: `home/${deviceInfo.roomId}/${deviceId}/status`,
                payload: JSON.stringify({
                    deviceId,
                    status: false,
                    isOnline: false,
                    isConnected: false,
                    lastSeenAt: now.toISOString(),
                    timestamp: now.toISOString(),
                }),
                qos: 1,
            });

            // Remove from tracking
            this.untrackDevice(deviceId);
        } catch (error) {
            this.logger.error(`Error checking device ${deviceId} heartbeat: ${error.message}`);
        }
    }

    async handleHeartbeatResponse(deviceId: string, timestamp: string): Promise<void> {
        const deviceInfo = this.activeDevices.get(deviceId);

        if (!deviceInfo) return;

        deviceInfo.lastSeen = new Date();
        deviceInfo.isOnline = true;
        deviceInfo.isConnected = true;

        this.logger.debug(`Updated heartbeat for device ${deviceId}`);
    }

    async onModuleInit() {
        this.logger.log('MqttHeartbeatService initialized');
    }
}
