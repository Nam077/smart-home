export interface IMqttPublisher {
    publishToDevice(deviceId: string, topic: string, message: any): Promise<void>;
}
