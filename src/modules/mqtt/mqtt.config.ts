import { registerAs } from '@nestjs/config';

export default registerAs('mqtt', () => ({
    port: parseInt(process.env.MQTT_PORT, 10) || 1883,
    host: process.env.MQTT_HOST || 'localhost',
    wsPort: parseInt(process.env.MQTT_WS_PORT, 10) || 8883,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    // Topics
    topics: {
        deviceStatus: 'device/+/status', // device/{deviceId}/status
        deviceControl: 'device/+/control', // device/{deviceId}/control
        deviceData: 'device/+/data', // device/{deviceId}/data
    },
}));
