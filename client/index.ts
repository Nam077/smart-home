import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

// Device control types
enum DeviceControlTypeEnum {
    SET_STATUS = 'set_status',
    SET_VALUE = 'set_value',
    SET_BRIGHTNESS = 'set_brightness',
    SET_TEMPERATURE = 'set_temperature',
    GET_INFO = 'get_info',
}

interface DeviceControlDto {
    type: DeviceControlTypeEnum;
    value: number | boolean;
}

interface Device {
    id: string;
    status: boolean;
    value?: number;
    brightness?: number;
    temperature?: number;
}

interface ControlResponse {
    deviceId: string;
    type: DeviceControlTypeEnum;
    value: number | boolean;
    device: Device;
}

interface ControlError {
    deviceId: string;
    error: string;
}

class SmartHomeClient {
    private socket: Socket;
    private deviceId: string = '5946beb7-cbc9-4d47-976a-8c2daf94c2d7';

    constructor() {
        // Connect to WebSocket server
        this.socket = io('http://localhost:3000', {
            transports: ['websocket'],
            autoConnect: true,
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    private setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.testDeviceControl();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        // Device control events
        this.socket.on('device:control:success', (response: ControlResponse) => {
            console.log('Device control success:', response);
        });

        this.socket.on('device:control:error', (error: ControlError) => {
            console.error('Device control error:', error);
        });
    }

    private async testDeviceControl() {
        try {
            console.log('Testing device control...');

            // Test SET_STATUS
            console.log('\nTesting SET_STATUS...');
            await this.controlDevice({
                type: DeviceControlTypeEnum.SET_STATUS,
                value: true,
            });
            console.log('SET_STATUS command completed');

            // Wait 2 seconds
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Test SET_VALUE
            console.log('\nTesting SET_VALUE...');
            await this.controlDevice({
                type: DeviceControlTypeEnum.SET_VALUE,
                value: 75,
            });
            console.log('SET_VALUE command completed');

            // Wait 2 seconds
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Test SET_BRIGHTNESS
            console.log('\nTesting SET_BRIGHTNESS...');
            await this.controlDevice({
                type: DeviceControlTypeEnum.SET_BRIGHTNESS,
                value: 80,
            });
            console.log('SET_BRIGHTNESS command completed');

            // Wait 2 seconds
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Test SET_TEMPERATURE
            console.log('\nTesting SET_TEMPERATURE...');
            await this.controlDevice({
                type: DeviceControlTypeEnum.SET_TEMPERATURE,
                value: 25,
            });
            console.log('SET_TEMPERATURE command completed');

            console.log('\nAll tests completed successfully!');
        } catch (error) {
            if (error instanceof Error) {
                console.error('\nError in test sequence:', error.message);
            } else {
                console.error('\nUnknown error in test sequence');
            }
        }
    }

    private controlDevice(command: DeviceControlDto): Promise<ControlResponse> {
        return new Promise((resolve, reject) => {
            const payload = {
                deviceId: this.deviceId,
                ...command,
            };

            console.log(`Sending command:`, payload);

            // Send control command
            this.socket.emit('device:control', payload);

            // Setup temporary listeners for this command
            const successListener = (response: ControlResponse) => {
                if (response.deviceId === this.deviceId) {
                    console.log(`Command succeeded:`, response);
                    cleanup();
                    resolve(response);
                }
            };

            const errorListener = (error: ControlError) => {
                if (error.deviceId === this.deviceId) {
                    console.error(`Command failed:`, error);
                    cleanup();
                    reject(new Error(error.error));
                }
            };

            // Cleanup function to remove temporary listeners
            const cleanup = () => {
                this.socket.off('device:control:success', successListener);
                this.socket.off('device:control:error', errorListener);
            };

            // Add temporary listeners
            this.socket.on('device:control:success', successListener);
            this.socket.on('device:control:error', errorListener);

            // Set timeout
            setTimeout(() => {
                cleanup();
                reject(new Error('Command timeout after 5 seconds'));
            }, 5000);
        });
    }
}

// Create and start client
const client = new SmartHomeClient();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nClosing client...');
    client['socket'].close();
    process.exit();
});
