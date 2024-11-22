import * as mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
import { v4 as uuidv4 } from 'uuid';

class SmartDeviceSimulator {
    private client: MqttClient;
    private deviceId: string;
    private status: {
        power: boolean;
        brightness?: number;
        temperature?: number;
    };

    constructor(deviceId?: string) {
        this.deviceId = deviceId || uuidv4();
        this.status = {
            power: false,
            brightness: 0,
            temperature: 25,
        };
    }

    connect() {
        // Kết nối đến MQTT broker
        this.client = mqtt.connect('mqtt://localhost:1883', {
            clientId: `device_${this.deviceId}`,
            username: 'smarthome',
            password: 'smarthome123',
        });

        this.client.on('connect', () => {
            console.log(`Device ${this.deviceId} connected to MQTT broker`);

            // Publish trạng thái online
            this.publishStatus('online');

            // Subscribe vào topic điều khiển
            const controlTopic = `device/${this.deviceId}/control`;

            this.client.subscribe(controlTopic, (err) => {
                if (!err) {
                    console.log(`Subscribed to ${controlTopic}`);
                }
            });
        });

        // Xử lý các lệnh điều khiển
        this.client.on('message', (topic, message) => {
            try {
                const command = JSON.parse(message.toString());

                console.log(`Received command:`, command);

                // Cập nhật trạng thái theo lệnh
                if (command.power !== undefined) {
                    this.status.power = command.power;
                }

                if (command.brightness !== undefined) {
                    this.status.brightness = command.brightness;
                }

                if (command.temperature !== undefined) {
                    this.status.temperature = command.temperature;
                }

                // Publish trạng thái mới
                this.publishStatus('active');

                console.log('New device status:', this.status);
            } catch (error) {
                console.error('Error processing command:', error);
            }
        });

        // Xử lý mất kết nối
        this.client.on('offline', () => {
            console.log(`Device ${this.deviceId} disconnected`);
            this.publishStatus('offline');
        });

        // Xử lý lỗi
        this.client.on('error', (error) => {
            console.error('MQTT client error:', error);
        });
    }

    private publishStatus(state: 'online' | 'offline' | 'active') {
        const statusTopic = `device/${this.deviceId}/status`;

        const statusMessage = {
            state,
            ...this.status,
            timestamp: new Date().toISOString(),
        };

        this.client.publish(statusTopic, JSON.stringify(statusMessage));
    }

    getDeviceId(): string {
        return this.deviceId;
    }
}

// Tạo và chạy thiết bị mô phỏng
const device = new SmartDeviceSimulator();

device.connect();

console.log('Device ID:', device.getDeviceId());

// Giữ cho process chạy
process.on('SIGINT', () => {
    console.log('Shutting down device simulator...');
    process.exit();
});
