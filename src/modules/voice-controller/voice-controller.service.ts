import { Injectable } from '@nestjs/common';
import Fuse from 'fuse.js';

import { DeviceService } from '@app/modules/device/services/device.service';
import { CreateVoiceControllerDto } from '@app/modules/voice-controller/dto/create-voice-controller.dto';
import { MqttPublisherService } from '@app/modules/global/services/mqtt-publisher.service';
import { CommandTypeEnum } from '@app/modules/mqtt/types/mqtt.types';

@Injectable()
export class VoiceControllerService {
    private readonly turnOnKeywords = ['bật', 'mở', 'on', 'turn on'];
    private readonly turnOffKeywords = ['tắt', 'đóng', 'off', 'turn off']
    private readonly roomKeywords = ['phòng', 'room'];

    constructor(private readonly deviceService: DeviceService, private readonly mqttPublisher: MqttPublisherService) {}

    private findBestMatch(searchText: string, items: Array<{ name: string }>, threshold = 0.3): { name: string, score: number } | null {
        const fuseOptions = {
            includeScore: true,
            threshold: threshold,
            keys: ['name']
        };

        const fuse = new Fuse(items, fuseOptions);
        const results = fuse.search(searchText);

        if (results.length > 0) {
            const bestMatch = results[0];
            return {
                name: bestMatch.item.name,
                score: bestMatch.score || 1
            };
        }

        return null;
    }

    private extractSearchableText(command: string): string {
        // Remove control keywords
        let searchText = command;
        [...this.turnOnKeywords, ...this.turnOffKeywords, ...this.roomKeywords].forEach(keyword => {
            searchText = searchText.replace(keyword, '');
        });
        return searchText.trim();
    }

    async handler(createVoiceControllerDto: CreateVoiceControllerDto) {
        const devices = await this.deviceService.findDeviceByControllerId(createVoiceControllerDto.controllerId);
        
        if (!devices || devices.length === 0) {
            throw new Error('No devices found for this controller');
        }

        const command = createVoiceControllerDto.text.toLowerCase();
        let isOn: boolean | null = null;

        // Check if command contains turn on keywords
        for (const keyword of this.turnOnKeywords) {
            if (command.includes(keyword)) {
                isOn = true;
                break;
            }
        }

        // Check if command contains turn off keywords
        if (isOn === null) {
            for (const keyword of this.turnOffKeywords) {
                if (command.includes(keyword)) {
                    isOn = false;
                    break;
                }
            }
        }

        if (isOn === null) {
            throw new Error('No valid command found in voice input');
        }

        // Check if this is a room-level command
        let isRoomCommand = false;
        for (const keyword of this.roomKeywords) {
            if (command.includes(keyword)) {
                isRoomCommand = true;
                break;
            }
        }

        let matchedDevices = [];
        const searchableText = this.extractSearchableText(command);

        if (isRoomCommand) {
            // Get unique rooms from devices
            const rooms = Array.from(new Set(devices.map(device => device.room)))
                .map(room => ({ name: room.name.toLowerCase() }));

            // Find best matching room
            const bestRoomMatch = this.findBestMatch(searchableText, rooms);
            
            if (bestRoomMatch) {
                matchedDevices = devices.filter(
                    device => device.room.name.toLowerCase() === bestRoomMatch.name
                );
            }
        } else {
            // Prepare devices for fuzzy search
            const searchableDevices = devices.map(device => ({
                name: device.name.toLowerCase(),
                originalDevice: device
            }));

            // Find best matching device
            const bestDeviceMatch = this.findBestMatch(searchableText, searchableDevices);
            
            if (bestDeviceMatch) {
                const matchedDevice = searchableDevices.find(
                    d => d.name === bestDeviceMatch.name
                );
                if (matchedDevice) {
                    matchedDevices = [matchedDevice.originalDevice];
                }
            }
        }

        // If no matches found, don't default to all devices
        if (matchedDevices.length === 0) {
            throw new Error('No matching devices or rooms found for the command');
        }

        // Update device status through MQTT directly
        const results = await Promise.all(
            matchedDevices.map(async device => {
                try {
                    const command = CommandTypeEnum.SET_STATUS;
                    await this.mqttPublisher.publishToDevice(
                        device.room.id,
                        device.id,
                        command,
                        isOn
                    );
                    
                    // Update device status in database
                    await this.deviceService.updateDeviceStatus(device.id, isOn);
                    
                    return {
                        deviceId: device.id,
                        name: device.name,
                        roomName: device.room.name,
                        success: true,
                        command
                    };
                } catch (error) {
                    return {
                        deviceId: device.id,
                        name: device.name,
                        roomName: device.room.name,
                        success: false,
                        error: error.message
                    };
                }
            })
        );

        return {
            command: CommandTypeEnum.SET_STATUS,
            value: isOn,
            isRoomCommand,
            results
        };
    }
}
