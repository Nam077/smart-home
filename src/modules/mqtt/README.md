# MQTT Module Documentation

## Overview
The MQTT module provides MQTT broker functionality for IoT device communication in the smart home system. It handles device connections, message routing, and device control commands.

## Module Structure

```
mqtt/
├── dto/                    # Data Transfer Objects
│   └── device-control.dto.ts
├── interfaces/            # MQTT interfaces
│   └── mqtt-publisher.interface.ts
├── services/             # MQTT services
│   ├── mqtt-handler.service.ts
│   ├── mqtt-heartbeat.service.ts
│   └── mqtt-publisher.service.ts
├── types/                # MQTT types and enums
│   └── mqtt.types.ts
├── mqtt.config.ts        # MQTT configuration
├── mqtt.controller.ts    # MQTT controller
├── mqtt.module.ts        # Module definition
└── mqtt.service.ts       # Main MQTT service
```

## Core Components

### 1. MqttService
- Main service that manages the MQTT broker
- Handles client authentication
- Sets up TCP and WebSocket servers
- Manages client connections and disconnections

### 2. MqttHandlerService
- Processes MQTT messages
- Handles device control commands
- Updates device status
- Manages device connections/disconnections

### 3. MqttPublisherService
- Handles message publishing
- Manages topic subscriptions
- Provides message delivery confirmation

### 4. MqttHeartbeatService
- Monitors device connectivity
- Handles device timeouts
- Updates device online/offline status

## Message Types

### Device Connection Message
```typescript
// Device -> Server
{
  "command": "device_connect",
  "deviceInfo": {
    "ipAddress": "192.168.1.100",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "firmwareVersion": "1.0.0"  // optional
  },
  "timestamp": "2024-01-20T12:00:00Z"
}

// Server Response
{
  "id": "device-123",
  "name": "Living Room Light",
  "type": "LIGHT",
  "status": "ON",
  "isOnline": true,
  "isConnected": true,
  "lastSeenAt": "2024-01-20T12:00:00Z",
  "ipAddress": "192.168.1.100",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "firmwareVersion": "1.0.0"
}
```

### Device Control Commands
```typescript
// Device Status Control
{
  "command": "set_status",
  "value": true | false,
  "timestamp": "2024-01-20T12:00:00Z"
}

// Device Brightness Control
{
  "command": "set_brightness",
  "value": 0-100,
  "timestamp": "2024-01-20T12:00:00Z"
}

// Device Temperature Control
{
  "command": "set_temperature",
  "value": number,
  "timestamp": "2024-01-20T12:00:00Z"
}

// Device Speed Control
{
  "command": "set_speed",
  "value": number,
  "timestamp": "2024-01-20T12:00:00Z"
}

// Device Value Control
{
  "command": "set_value",
  "value": number,
  "timestamp": "2024-01-20T12:00:00Z"
}
```

### Device Status Updates
```typescript
{
  "status": "on" | "off",
  "brightness": number,
  "temperature": number,
  "speed": number,
  "value": number,
  "timestamp": "2024-01-20T12:00:00Z"
}
```

## Topic Structure
```
home/{roomId}/{deviceId}/{type}
```

### Topic Types
- `status`: Device status updates
- `control`: Device control commands
- `config`: Device configuration
- `error`: Device error messages

## Configuration
```typescript
// mqtt.config.ts
{
  host: string;          // MQTT broker host
  port: number;          // MQTT TCP port
  wsPort: number;        // MQTT WebSocket port
  username: string;      // MQTT authentication username
  password: string;      // MQTT authentication password
}
```

## Device Control Flow
1. Client sends control command to `home/{roomId}/{deviceId}/control`
2. MqttHandlerService processes command
3. Device state is updated in database
4. Status update is published to `home/{roomId}/{deviceId}/status`
5. Connected clients receive status update

## Error Handling
1. Invalid commands return error message
2. Device timeout triggers offline status
3. Connection errors are logged and reported
4. Authentication failures are tracked
5. Message validation errors are handled

## Security
1. Client authentication required
2. Topic access control
3. Message validation
4. Connection monitoring
5. Error logging and reporting

## Monitoring
1. Device connection status
2. Message delivery status
3. Error rates and types
4. System performance metrics
5. Client connection statistics

## Best Practices
1. Use appropriate QoS levels
2. Implement proper error handling
3. Monitor device health
4. Validate all messages
5. Follow security guidelines
6. Use proper topic structure
7. Handle reconnection gracefully

## API Integration
1. Device state synchronization
2. Command validation
3. Status persistence
4. Configuration management
5. Error reporting

For more details on implementation, refer to the specific service files and types definitions.
