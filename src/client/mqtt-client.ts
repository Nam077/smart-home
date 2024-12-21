import { Logger } from '@nestjs/common';
import * as mqtt from 'mqtt';

interface MqttConfig {
    clientId: string;
    username: string;
    password: string;
    brokerUrl?: string;
    host?: string;
    port?: number;
}

class MqttClient {
    private readonly logger = new Logger(MqttClient.name);
    private client: mqtt.MqttClient;
    private readonly brokerUrl: string;
    private readonly config: MqttConfig;
    private roomId: string;
    private deviceId: string;
    private activeSubscriptions: Set<string> = new Set();

    constructor(roomId: string, deviceId: string, config: MqttConfig) {
        this.roomId = roomId;
        this.deviceId = deviceId;
        this.config = config;
        this.brokerUrl = config.brokerUrl || `mqtt://${config.host}:${config.port}`;

        this.logger.debug(
            this.formatLogMessage('INITIALIZING_CLIENT', {
                brokerUrl: this.brokerUrl,
                clientId: this.config.clientId,
                roomId: this.roomId,
                deviceId: this.deviceId,
            }),
        );

        this.client = mqtt.connect(this.brokerUrl, {
            clientId: this.config.clientId,
            username: this.config.username,
            password: this.config.password,
            clean: true,
        });

        this.setupListeners();
        this.setupKeyboardControls();
    }

    private formatLogMessage(action: string, details: Record<string, any>): string {
        return `[${action}] ${JSON.stringify(details, null, 2)}`;
    }

    private setupListeners() {
        this.client.on('connect', () => {
            this.logger.log(
                this.formatLogMessage('CLIENT_CONNECTED', {
                    brokerUrl: this.brokerUrl,
                    clientId: this.config.clientId,
                }),
            );

            const topics = [
                `home/${this.roomId}/${this.deviceId}/status`,
                `home/${this.roomId}/${this.deviceId}/control`,
                `home/${this.roomId}/broadcast`,
                `home/${this.roomId}/config`,
            ];

            topics.forEach((topic) => {
                this.client.subscribe(topic, { qos: 1 }, (err, granted) => {
                    if (err) {
                        this.logger.error(
                            this.formatLogMessage('SUBSCRIBE_ERROR', {
                                topic,
                                error: err.message,
                            }),
                        );
                    } else {
                        this.activeSubscriptions.add(topic);

                        if (topic.endsWith('/status')) {
                            this.logger.log(
                                this.formatLogMessage('STATUS_SUBSCRIBE_SUCCESS', {
                                    topic,
                                    granted: granted,
                                }),
                            );
                        }
                    }
                });
            });

            this.publishDeviceInfo();
        });

        this.client.on('message', (topic: string, message: Buffer) => {
            try {
                const payload = message.toString();
                let data: any;

                try {
                    data = JSON.parse(payload);
                } catch (e) {
                    data = payload;
                }

                const topicParts = topic.split('/');
                const messageType = topicParts[topicParts.length - 1];

                if (messageType === 'status') {
                    this.logger.debug(
                        this.formatLogMessage('STATUS_MESSAGE_RECEIVED', {
                            topic,
                            topicParts,
                            payload: data,
                            timestamp: new Date().toISOString(),
                        }),
                    );

                    this.handleStatusUpdate(data);
                } else if (messageType === 'control') {
                    this.logger.debug(
                        this.formatLogMessage('CONTROL_MESSAGE_RECEIVED', {
                            topic,
                            command: data.command,
                            value: data.value,
                            timestamp: new Date().toISOString(),
                        }),
                    );

                    this.handleControlCommand(data);
                } else {
                    this.logger.debug(`Received ${messageType} message on ${topic}`);

                    switch (messageType) {
                        case 'broadcast':
                            this.handleBroadcast(data);
                            break;
                        case 'config':
                            this.handleConfig(data);
                            break;
                    }
                }
            } catch (error) {
                this.logger.error(
                    this.formatLogMessage('MESSAGE_PROCESSING_ERROR', {
                        error: error.message,
                        topic,
                        isStatusTopic: topic.endsWith('/status'),
                    }),
                );
            }
        });

        this.client.on('packetsend', (packet: mqtt.Packet) => {
            if ('topic' in packet && typeof packet.topic === 'string' && packet.topic.endsWith('/status')) {
                this.logger.debug(
                    this.formatLogMessage('STATUS_PACKET_SENT', {
                        topic: packet.topic,
                        packetType: packet.cmd,
                    }),
                );
            }
        });

        this.client.on('packetreceive', (packet: mqtt.Packet) => {
            if ('topic' in packet && typeof packet.topic === 'string' && packet.topic.endsWith('/status')) {
                this.logger.debug(
                    this.formatLogMessage('STATUS_PACKET_RECEIVED', {
                        topic: packet.topic,
                        packetType: packet.cmd,
                    }),
                );
            }
        });

        this.client.on('error', (error) => {
            this.logger.error(
                this.formatLogMessage('CONNECTION_ERROR', {
                    error: error.message,
                }),
            );
        });

        this.client.on('close', () => {
            this.logger.warn(
                this.formatLogMessage('CONNECTION_CLOSED', {
                    clientId: this.config.clientId,
                }),
            );
        });

        this.client.on('offline', () => {
            this.logger.warn(
                this.formatLogMessage('CLIENT_OFFLINE', {
                    clientId: this.config.clientId,
                }),
            );
        });

        this.client.on('reconnect', () => {
            this.logger.log(
                this.formatLogMessage('RECONNECTING', {
                    brokerUrl: this.brokerUrl,
                    clientId: this.config.clientId,
                }),
            );
        });
    }

    private handleStatusUpdate(status: any) {
        this.logger.log(
            this.formatLogMessage('STATUS_UPDATE', {
                roomId: this.roomId,
                deviceId: this.deviceId,
                status,
                timestamp: new Date().toISOString(),
            }),
        );
    }

    private handleControlCommand(command: any) {
        // Xử lý command không log
    }

    private handleBroadcast(message: any) {
        // Xử lý broadcast không log
    }

    private handleConfig(config: any) {
        // Xử lý config không log
    }

    public publishStatus(status: any) {
        const topic = `home/${this.roomId}/${this.deviceId}/status`;

        const message = {
            ...status,
            timestamp: new Date().toISOString(),
        };

        this.logger.debug(
            this.formatLogMessage('PUBLISHING_STATUS', {
                topic,
                status: message,
            }),
        );

        this.client.publish(topic, JSON.stringify(message), { qos: 1 }, (error) => {
            if (error) {
                this.logger.error(
                    this.formatLogMessage('PUBLISH_ERROR', {
                        topic,
                        error: error.message,
                    }),
                );
            } else {
                this.logger.debug(
                    this.formatLogMessage('STATUS_PUBLISHED', {
                        topic,
                        status: message,
                    }),
                );
            }
        });
    }

    public disconnect() {
        if (this.client) {
            this.logger.log(
                this.formatLogMessage('DISCONNECTING', {
                    clientId: this.config.clientId,
                }),
            );
            this.client.end();
        }
    }

    private publishDeviceInfo() {
        const deviceInfo = {
            deviceId: this.deviceId,
            roomId: this.roomId,
            clientId: this.config.clientId,
            timestamp: new Date().toISOString(),
            status: 'connected',
        };

        const topic = `home/${this.roomId}/${this.deviceId}/status`;

        this.logger.debug(
            this.formatLogMessage('PUBLISHING_DEVICE_INFO', {
                topic,
                deviceInfo,
            }),
        );

        this.client.publish(topic, JSON.stringify(deviceInfo), { qos: 1 }, (error) => {
            if (error) {
                this.logger.error(
                    this.formatLogMessage('PUBLISH_DEVICE_INFO_ERROR', {
                        error: error.message,
                    }),
                );
            } else {
                this.logger.log(
                    this.formatLogMessage('DEVICE_INFO_PUBLISHED', {
                        topic,
                        deviceInfo,
                    }),
                );
            }
        });
    }

    public checkSubscriptions() {
        const topics = [
            `home/${this.roomId}/${this.deviceId}/status`,
            `home/${this.roomId}/${this.deviceId}/control`,
            `home/${this.roomId}/broadcast`,
            `home/${this.roomId}/config`,
        ];

        this.logger.debug(
            this.formatLogMessage('CHECKING_SUBSCRIPTIONS', {
                topics,
                clientId: this.config.clientId,
            }),
        );

        topics.forEach((topic) => {
            if (this.activeSubscriptions.has(topic)) {
                this.logger.log(
                    this.formatLogMessage('SUBSCRIPTION_ACTIVE', {
                        topic,
                        qos: 1,
                    }),
                );
            } else {
                this.logger.warn(this.formatLogMessage('SUBSCRIPTION_INACTIVE', { topic }));
                this.client.subscribe(topic, { qos: 1 }, (err) => {
                    if (err) {
                        this.logger.error(
                            this.formatLogMessage('RESUBSCRIBE_ERROR', {
                                topic,
                                error: err.message,
                            }),
                        );
                    } else {
                        this.activeSubscriptions.add(topic);
                        this.logger.log(this.formatLogMessage('RESUBSCRIBE_SUCCESS', { topic }));
                    }
                });
            }
        });

        this.logger.debug(
            this.formatLogMessage('CURRENT_SUBSCRIPTIONS', {
                subscriptions: Array.from(this.activeSubscriptions),
                count: this.activeSubscriptions.size,
            }),
        );
    }

    public unsubscribe(topic: string) {
        this.client.unsubscribe(topic, (err) => {
            if (err) {
                this.logger.error(
                    this.formatLogMessage('UNSUBSCRIBE_ERROR', {
                        topic,
                        error: err.message,
                    }),
                );
            } else {
                this.activeSubscriptions.delete(topic);
                this.logger.log(this.formatLogMessage('UNSUBSCRIBE_SUCCESS', { topic }));
            }
        });
    }

    private setupKeyboardControls() {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        process.stdin.on('data', (key: Buffer | string) => {
            const keyStr = key.toString();

            if (keyStr === '\u0003') {
                // Ctrl+C
                this.disconnect();
                process.exit();
            }

            switch (keyStr) {
                case 'r': {
                    const controlMessage = {
                        command: 'set_status',
                        value: false,
                        timestamp: new Date().toISOString(),
                    };

                    const topic = `home/${this.roomId}/${this.deviceId}/control`;

                    this.logger.debug(
                        this.formatLogMessage('SENDING_CONTROL_COMMAND', {
                            topic,
                            message: controlMessage,
                        }),
                    );

                    this.client.publish(topic, JSON.stringify(controlMessage), { qos: 1 }, (error) => {
                        if (error) {
                            this.logger.error(
                                this.formatLogMessage('CONTROL_PUBLISH_ERROR', {
                                    error: error.message,
                                }),
                            );
                        } else {
                            this.logger.debug(
                                this.formatLogMessage('CONTROL_COMMAND_SENT', {
                                    topic,
                                    command: controlMessage.command,
                                    value: controlMessage.value,
                                }),
                            );
                        }
                    });
                    break;
                }

                case 'a': {
                    const controlMessage = {
                        command: 'device_connect',
                        deviceInfo: {
                            ipAddress: '192.168.1.100',
                            macAddress: 'AA:BB:CC:DD:EE:FF',
                            firmwareVersion: '1.0.0',
                        },
                        timestamp: new Date().toISOString(),
                    };

                    const topic = `home/${this.roomId}/${this.deviceId}/control`;

                    this.logger.debug(
                        this.formatLogMessage('SENDING_CONTROL_COMMAND', {
                            topic,
                            message: controlMessage,
                        }),
                    );

                    this.client.publish(topic, JSON.stringify(controlMessage), { qos: 1 }, (error) => {
                        if (error) {
                            this.logger.error(
                                this.formatLogMessage('CONTROL_PUBLISH_ERROR', {
                                    error: error.message,
                                }),
                            );
                        } else {
                            this.logger.debug(
                                this.formatLogMessage('CONTROL_COMMAND_SENT', {
                                    topic,
                                    command: controlMessage.command,
                                    value: controlMessage.deviceInfo,
                                }),
                            );
                        }
                    });
                    break;
                }
            }
        });
    }
}

/**
 *
 */
async function main() {
    const config: MqttConfig = {
        clientId: `smarthome_client_${Date.now()}`,
        username: 'smarthome',
        password: 'smarthome123',
        host: 'localhost',
        port: 1883,
    };

    try {
        const client = new MqttClient(
            '1b093955-5ffa-483c-abfb-b5c14b228939',
            '08091537-da21-4ea6-a0b3-c5f799236bd0',
            config,
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));

        client.checkSubscriptions();

        client.publishStatus({
            test: true,
            timestamp: new Date().toISOString(),
        });

        process.on('SIGINT', () => {
            client.disconnect();
            process.exit(0);
        });
    } catch (error) {
        console.error('Error in main:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export default MqttClient;
