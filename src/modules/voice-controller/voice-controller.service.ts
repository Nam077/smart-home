import { Injectable } from '@nestjs/common';

import { DeviceService } from '@app/modules/device/services/device.service';
import { CreateVoiceControllerDto } from '@app/modules/voice-controller/dto/create-voice-controller.dto';
import { MqttPublisherService } from '@app/modules/global/services/mqtt-publisher.service';
import { CommandTypeEnum } from '@app/modules/mqtt/types/mqtt.types';
import { AIService } from '@app/modules/global/services/ai.service';
import { Device } from '@app/modules/device/entities/device.entity';

interface DeviceClean {
    id: string;
    name: string;
    roomName: string;
    status: number; // 0 or 1
    value: number;
    unit: string;
}

export interface AIControlResponse {
    type: 'control';
    d: Array<{
        i: string; // id
        s: number; // status (0 or 1)
        v: number; // value
    }>;
}

export interface AIInfoResponse {
    type: 'info';
    text: string; // Text response about device status
}

export type AIResponse = AIControlResponse | AIInfoResponse;

@Injectable()
export class VoiceControllerService {
    constructor(
        private readonly deviceService: DeviceService,
        private readonly mqttPublisher: MqttPublisherService,
        private readonly geminiAIService: AIService,
    ) {}

    async handler(createVoiceControllerDto: CreateVoiceControllerDto): Promise<string> {
        const devices = await this.deviceService.findDeviceByControllerId(createVoiceControllerDto.controllerId);
        if (!devices || devices.length === 0) {
            throw new Error('No devices found for this controller');
        }

        const deviceClean = cleanDevice(devices);
        const { text } = createVoiceControllerDto;

        // Create minimal context with status
        const context = deviceClean
            .map((d) => `${d.name}|${d.roomName}>${d.id}:${d.status}:${d.value}${d.unit}`)
            .join(',');

        console.log(context);

        // Define response formats
        const controlFormat = `{"type":"control","d":[{"i":"id","s":0|1,"v":number}]}`;
        const infoFormat = `{"type":"info","text":"[nội dung trả lời]"}`;

        // Add instruction message
        const instruction = `
        Analyze command: "${text}".
        Devices: ${context} (format: name|room>id:status, 0=OFF, 1=ON, value:unit).
        Return:
        - For control: ${controlFormat}
        - For info: ${infoFormat} (trả lời dạng text trong json)`;

        // Get structured response from AI
        const response = await this.geminiAIService.generateStructuredOutput<AIResponse>(
            text,
            instruction,
            controlFormat,
            infoFormat,
        );

        // Handle response based on type
        if (response.type === 'control') {
            // Update devices and publish status
            const now = new Date();
            const updates = [];
            const mqttMessages = [];

            for (const change of response.d) {
                const device = devices.find((d) => d.id === change.i);
                if (!device) continue;

                let needsUpdate = false;

                // Check status change
                if (device.status !== (change.s === 1)) {
                    device.status = change.s === 1;
                    needsUpdate = true;
                }

                // Only update value if it's not null and different
                if (change.v !== null && device.value !== change.v) {
                    device.value = change.v;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    updates.push(device);
                    const statusMessage = {
                        id: device.id,
                        status: device.status,
                        value: device.value,
                        isOnline: device.isOnline,
                        isConnected: device.isConnected,
                        timestamp: now.toISOString(),
                    };

                    await this.mqttPublisher.publish({
                        topic: `home/${device.room.id}/${device.id}/status`,
                        payload: JSON.stringify(statusMessage),
                        qos: 1,
                        retain: false,
                    });
                }
            }

            // Save all changes and publish all messages in parallel
            if (updates.length > 0) {
                await Promise.all([
                    this.deviceService.saveMany(updates),
                    ...mqttMessages.map((msg) => this.mqttPublisher.publish(msg)),
                ]);

                // Group devices by type of change
                const statusChanges = [];
                const valueChanges = [];

                updates.forEach((device) => {
                    const change = response.d.find((d) => d.i === device.id);
                    if (!change) return;

                    if (change.v !== null) {
                        valueChanges.push({
                            name: device.name,
                            room: device.room.name,
                            value: device.value,
                            unit: device.unit || '',
                        });
                    } else {
                        statusChanges.push({
                            name: device.name,
                            room: device.room.name,
                            status: device.status,
                        });
                    }
                });

                // Build response message
                const responseMessages = [];

                if (valueChanges.length > 0) {
                    const valueMsg = valueChanges
                        .map((device) => `${device.name} ở ${device.room} thành ${device.value}${device.unit}`)
                        .join(', ');
                    responseMessages.push(`Đã điều chỉnh ${valueMsg}`);
                }

                if (statusChanges.length > 0) {
                    const status = statusChanges[0].status;
                    const statusMsg = statusChanges.map((device) => `${device.name} ở ${device.room}`).join(', ');
                    responseMessages.push(`Đã ${status ? 'bật' : 'tắt'} ${statusMsg}`);
                }

                return responseMessages.join('. ');
            }
            return 'Không có thiết bị nào cần thay đổi';
        } else {
            // For info queries, return the text directly
            return response.text;
        }
    }
}

export const cleanDevice = (devices: Device[]): DeviceClean[] => {
    return devices.map((device) => ({
        id: device.id,
        name: device.name,
        roomName: device.room.name,
        status: device.status ? 1 : 0,
        value: device.value,
        unit: device.unit,
    }));
};
