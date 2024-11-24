# Smart Home Backend

A modern, scalable smart home backend system built with NestJS, featuring real-time device control, room management, and comprehensive IoT device support.

## Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control
  - Device authentication

- 🏠 **Room Management**
  - Create and manage rooms
  - Floor plans and room grouping
  - Room-based device organization

- 📱 **Device Management**
  - Multiple device types support
  - Real-time device control
  - Device status monitoring
  - Firmware updates
  - Device grouping

- 🔄 **MQTT Integration**
  - Real-time device communication
  - Secure device connections
  - Automatic device discovery
  - Status monitoring

- 👥 **User Management**
  - User registration and authentication
  - Role management
  - User preferences

## Modules

### 🔐 Auth Module

The authentication module handles user authentication and authorization using JWT tokens.

**Features:**
- JWT-based authentication
- Secure password hashing
- Email validation
- Minimum password length: 6 characters
- Token-based session management

### 📱 Device Module

The device module manages all IoT devices in the smart home system.

**Supported Device Types:**
- `SENSOR`: Environmental and state sensors
- `ACTUATOR`: Control and automation devices

**Device Functions:**
- `RELAY`: On/Off control
- `SENSOR`: Data collection
- `DIMMER`: Variable control
- `RGB`: Color control

**Features:**
- Device discovery and registration
- Real-time status monitoring
- Firmware management
- Device grouping and organization
- Comprehensive event logging

### 🏠 Room Module

The room module manages physical spaces within the smart home system.

**Features:**
- Room CRUD operations
- Device-to-room assignment
- Floor-based organization
- Area management
- Room status monitoring

**API Endpoints:**
- `POST /rooms`: Create new room
- `GET /rooms`: List all rooms
- `GET /rooms/:id`: Get specific room
- `PATCH /rooms/:id`: Update room
- `DELETE /rooms/:id`: Soft delete room
- `DELETE /rooms/:id/hard`: Hard delete room
- `PUT /rooms/:id/restore`: Restore deleted room

### 👥 User Module

The user module handles user account management and permissions.

**Features:**
- User registration and authentication
- Profile management
- Role-based access control
- User preferences
- Account recovery

**User Properties:**
- Email (required, unique)
- Username (required, unique, min length: 3)
- Password (required, min length: 8)
- First Name (optional)
- Last Name (optional)

### 🔄 MQTT Module

The MQTT module handles real-time communication with IoT devices.

**Topic Structure:**
- Format: `home/{roomId}/{deviceId}/{type}`
- Types: `status`, `control`, `config`, `error`

**Message Types:**
- Device Connection
- Status Updates
- Control Commands
- Configuration Changes
- Error Reports

**Security Features:**
- Topic-based access control
- Message validation
- Connection monitoring
- Error logging
- Secure device authentication

**Environment Configuration:**
```env
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_WS_PORT=8883
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=mqtt_password
API_URL=http://localhost:3000
```

## Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/smart-home-backend.git
cd smart-home-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the application**
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## MQTT Message Format

### Device Connection
When a device connects to the MQTT broker, it should send a DEVICE_CONNECT command with its device info:

```json
// Device -> Server (DEVICE_CONNECT)
{
  "command": "device_connect",
  "deviceInfo": {
    "ipAddress": "192.168.1.100",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "firmwareVersion": "1.0.0"  // optional
  },
  "timestamp": "2024-01-20T12:00:00Z"
}

// Server -> Device (Status Response)
{
  "id": "device-123",
  "roomId": "room-456",
  "name": "Living Room Light",
  "type": "LIGHT",
  "status": "ON",
  "value": 100,
  "brightness": 80,
  "temperature": 25,
  "isOnline": true,
  "isConnected": true,
  "lastSeenAt": "2024-01-20T12:00:00Z",
  "ipAddress": "192.168.1.100",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "firmwareVersion": "1.0.0",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

Required fields in deviceInfo:
- `ipAddress`: Device's IP address
- `macAddress`: Device's MAC address

Optional fields:
- `firmwareVersion`: Device's firmware version

### Command Message Structure
```typescript
interface ICommandMessage {
  command: CommandTypeEnum;
  value?: any;
  deviceInfo?: IDeviceInfo;
  timestamp: string;
}

interface IDeviceInfo {
  ipAddress: string;
  macAddress: string;
  firmwareVersion?: string;
}
```

### Topic Structure
```
home/{roomId}/{deviceId}/{type}
```

Where:
- `roomId`: ID of the room where device is located
- `deviceId`: Unique identifier of the device
- `type`: One of the following:
  - `status`: Device status updates
  - `control`: Device control commands
  - `data`: Device sensor data
  - `error`: Device error messages

## Device Control Example

### 1. Fetch Devices by Controller

```typescript
// deviceService.ts
async function getDevicesByController(controllerId: string) {
  try {
    const response = await fetch(`http://localhost:3000/devices/controller/${controllerId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
}

// Example usage
const CONTROLLER_ID = '9c153bbd-e8b6-4aa0-894e-bbf6dfecd1f1';

// Get devices and connect to MQTT
async function initializeDeviceControl() {
  try {
    // 1. Fetch devices from the controller
    const devices = await getDevicesByController(CONTROLLER_ID);
    console.log('Found devices:', devices.map(d => d.name));

    // 2. Initialize MQTT client
    const client = mqtt.connect('mqtt://localhost:1883', {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD
    });

    // 3. Handle MQTT connection
    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      
      // Subscribe to all device topics
      devices.forEach(device => {
        const topics = [
          `home/${device.room.id}/${device.id}/status`,
          `home/${device.room.id}/${device.id}/control`,
          `home/${device.room.id}/${device.id}/data`
        ];

        topics.forEach(topic => {
          client.subscribe(topic, (err) => {
            if (!err) {
              console.log(`Subscribed to ${topic}`);
            }
          });
        });

        // Send initial status request
        client.publish(`home/${device.room.id}/${device.id}/control`, JSON.stringify({
          command: 'GET_STATUS',
          timestamp: new Date().toISOString()
        }));
      });
    });

    // 4. Handle incoming messages
    client.on('message', (topic, message) => {
      const data = JSON.parse(message.toString());
      const [, roomId, deviceId, messageType] = topic.split('/');

      // Find device in our list
      const device = devices.find(d => d.id === deviceId);
      if (!device) return;

      switch (messageType) {
        case 'status':
          updateDeviceStatus(device, data);
          break;
        case 'data':
          handleDeviceData(device, data);
          break;
        case 'error':
          handleDeviceError(device, data);
          break;
      }
    });

    return { devices, client };
  } catch (error) {
    console.error('Failed to initialize device control:', error);
    throw error;
  }
}

// Helper functions for device updates
function updateDeviceStatus(device, data) {
  console.log(`Status update for ${device.name}:`, {
    isOnline: data.status === 'online',
    power: data.state?.power,
    brightness: data.state?.brightness,
    lastUpdate: data.timestamp
  });

  // Update UI or device state here
  device.isOnline = data.status === 'online';
  device.status = data.state?.power;
  device.brightness = data.state?.brightness;
  device.lastSeenAt = data.timestamp;
}

function handleDeviceData(device, data) {
  console.log(`Data received from ${device.name}:`, {
    temperature: data.measurements?.temperature,
    humidity: data.measurements?.humidity,
    timestamp: data.timestamp
  });

  // Update device measurements
  device.temperature = data.measurements?.temperature;
  device.humidity = data.measurements?.humidity;
}

function handleDeviceError(device, data) {
  console.error(`Error from ${device.name}:`, {
    error: data.error,
    message: data.message,
    timestamp: data.timestamp
  });

  // Update device error state
  device.lastError = data.message;
  device.lastErrorAt = data.timestamp;
}

// Example device control functions
function controlDevice(client, device, command, value) {
  const topic = `home/${device.room.id}/${device.id}/control`;
  const message = {
    command,
    value,
    timestamp: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    client.publish(topic, JSON.stringify(message), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Usage example
async function main() {
  try {
    const { devices, client } = await initializeDeviceControl();

    // Example: Control first device
    const device = devices[0];
    if (device) {
      // Turn on the device
      await controlDevice(client, device, 'SET_STATUS', true);
      console.log(`Sent command to turn on ${device.name}`);

      // Set brightness to 75%
      await controlDevice(client, device, 'SET_BRIGHTNESS', 75);
      console.log(`Sent command to set brightness of ${device.name} to 75%`);
    }

    // Example: Monitor all devices
    setInterval(() => {
      devices.forEach(device => {
        console.log(`${device.name} status:`, {
          online: device.isOnline,
          power: device.status,
          brightness: device.brightness,
          lastSeen: device.lastSeenAt,
          error: device.lastError
        });
      });
    }, 30000); // Check every 30 seconds

  } catch (error) {
    console.error('Error in main:', error);
  }
}

// Run the example
main();

### 2. MQTT Client Integration

```typescript
import * as mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883', {
  username: 'your_username',
  password: 'your_password'
});

// Subscribe to device topics
devices.forEach(device => {
  const topics = [
    `home/${device.room.id}/${device.id}/status`,
    `home/${device.room.id}/${device.id}/data`,
    `home/${device.room.id}/${device.id}/error`
  ];
  
  topics.forEach(topic => client.subscribe(topic));
});

// Handle messages
client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  console.log(`Received message on ${topic}:`, data);
  updateDeviceUI(topic, data);
});
```

### 3. IoT Device Implementation (ESP32/Arduino)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";

// MQTT configuration
const char* mqtt_server = "your_mqtt_server";
const int mqtt_port = 1883;
const char* mqtt_user = "your_username";
const char* mqtt_password = "your_password";

// Device configuration
const char* device_id = "a9cc9b6f-b137-4963-bdeb-ed991b4bdfcd";
const char* room_id = "c0a18d8e-3d87-473b-8201-c49682d9fb19";
const char* controller_id = "9c153bbd-e8b6-4aa0-894e-bbf6dfecd1f1";

// Topics
String status_topic = String("home/") + room_id + "/" + device_id + "/status";
String control_topic = String("home/") + room_id + "/" + device_id + "/control";
String data_topic = String("home/") + room_id + "/" + device_id + "/data";
String error_topic = String("home/") + room_id + "/" + device_id + "/error";

// Pin configuration
const int RELAY_PIN = 18;  // GPIO18
const int LED_PIN = 2;     // Built-in LED

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void connect_mqtt() {
  while (!client.connected()) {
    Serial.println("Connecting to MQTT...");
    
    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println("MQTT connected");
      
      // Send DEVICE_CONNECT message
      DynamicJsonDocument doc(1024);
      doc["command"] = "device_connect";
      doc["deviceInfo"]["id"] = device_id;
      doc["deviceInfo"]["type"] = "actuator";
      doc["deviceInfo"]["function"] = "relay";
      doc["deviceInfo"]["controlPin"] = "GPIO18";
      doc["deviceInfo"]["firmwareVersion"] = "1.0.0";
      doc["deviceInfo"]["ipAddress"] = WiFi.localIP().toString();
      doc["deviceInfo"]["macAddress"] = WiFi.macAddress();
      
      String message;
      serializeJson(doc, message);
      client.publish(status_topic.c_str(), message.c_str());
      
      // Subscribe to control topic
      client.subscribe(control_topic.c_str());
    } else {
      Serial.println("MQTT connection failed, retrying in 5 seconds");
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  if (doc.containsKey("command")) {
    String command = doc["command"];
    
    if (command == "SET_STATUS") {
      bool value = doc["value"];
      digitalWrite(RELAY_PIN, value ? HIGH : LOW);
      send_status(value);
    }
    else if (command == "SET_BRIGHTNESS") {
      int brightness = doc["value"];
      // Implement brightness control using PWM
      analogWrite(LED_PIN, map(brightness, 0, 100, 0, 255));
      send_status(true, brightness);
    }
  }
}

void send_status(bool status, int brightness = -1) {
  DynamicJsonDocument doc(1024);
  doc["status"] = status ? "online" : "offline";
  doc["state"]["power"] = status;
  if (brightness >= 0) {
    doc["state"]["brightness"] = brightness;
  }
  doc["timestamp"] = millis();
  
  String message;
  serializeJson(doc, message);
  client.publish(status_topic.c_str(), message.c_str());
}

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Setup MQTT with fetched configuration
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    connect_mqtt();
  }
  client.loop();

  // Send periodic status updates
  unsigned long now = millis();
  if (now - lastMsg > 30000) {
    lastMsg = now;
    send_status(digitalRead(RELAY_PIN));
  }
}

### 4. Testing the Integration

1. **Start the backend server**:
```bash
npm run start:dev
```

2. **Flash the ESP32 code** to your device using Arduino IDE or PlatformIO.

3. **Monitor device connection**:
```typescript
// Subscribe to device status
client.subscribe(`home/${roomId}/${deviceId}/status`, (err) => {
  if (!err) {
    console.log('Waiting for device connection...');
  }
});

// Handle connection message
client.on('message', (topic, message) => {
  if (topic.endsWith('/status')) {
    const data = JSON.parse(message.toString());
    if (data.command === 'DEVICE_CONNECT') {
      console.log('Device connected:', data.deviceInfo);
    }
  }
});
```

4. **Control the device**:
```typescript
// Turn on the light
client.publish(`home/${roomId}/${deviceId}/control`, JSON.stringify({
  command: 'SET_STATUS',
  value: true,
  timestamp: new Date().toISOString()
}));

// Set brightness to 75%
client.publish(`home/${roomId}/${deviceId}/control`, JSON.stringify({
  command: 'SET_BRIGHTNESS',
  value: 75,
  timestamp: new Date().toISOString()
}));
```

5. **Monitor device status**:
```typescript
client.on('message', (topic, message) => {
  if (topic.endsWith('/status')) {
    const data = JSON.parse(message.toString());
    console.log('Device status:', {
      power: data.state?.power,
      brightness: data.state?.brightness,
      timestamp: data.timestamp
    });
  }
});
```

## IoT Device Integration Example

### 1. Device Implementation (ESP32)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

// WiFi Configuration
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";

// Backend API Configuration
const char* apiHost = "http://localhost:3000";
const char* accessToken = "your_access_token";
const char* controllerId = "9c153bbd-e8b6-4aa0-894e-bbf6dfecd1f1";

// MQTT Configuration
const char* mqttHost = "localhost";
const int mqttPort = 1883;
const char* mqttUsername = "mqtt_user";
const char* mqttPassword = "mqtt_password";

// Device Information
String deviceId;
String roomId;
String deviceName;
String deviceType;

// MQTT Topics
String statusTopic;
String controlTopic;
String dataTopic;
String errorTopic;

WiFiClient espClient;
PubSubClient mqttClient(espClient);
HTTPClient http;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Get device configuration from backend
  fetchDeviceConfig();
  
  // Setup MQTT with fetched configuration
  setupMQTT();
}

void fetchDeviceConfig() {
  String url = String(apiHost) + "/devices/controller/" + controllerId;
  
  http.begin(url);
  http.addHeader("Authorization", String("Bearer ") + accessToken);
  
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    
    DynamicJsonDocument doc(4096);
    deserializeJson(doc, payload);
    
    String ourMac = WiFi.macAddress();
    JsonArray devices = doc["data"];
    
    for (JsonObject device : devices) {
      if (device["macAddress"].as<String>() == ourMac) {
        deviceId = device["id"].as<String>();
        deviceName = device["name"].as<String>();
        deviceType = device["type"].as<String>();
        roomId = device["room"]["id"].as<String>();
        
        // Setup MQTT topics using the correct format: home/{roomId}/{deviceId}/{type}
        statusTopic = "home/" + roomId + "/" + deviceId + "/status";
        controlTopic = "home/" + roomId + "/" + deviceId + "/control";
        dataTopic = "home/" + roomId + "/" + deviceId + "/data";
        errorTopic = "home/" + roomId + "/" + deviceId + "/error";
        
        Serial.println("Device configured:");
        Serial.println("ID: " + deviceId);
        Serial.println("Name: " + deviceName);
        Serial.println("Room: " + roomId);
        break;
      }
    }
  }
  
  http.end();
}

void setupMQTT() {
  mqttClient.setServer(mqttHost, mqttPort);
  mqttClient.setCallback(handleMQTTMessage);
  connectMQTT();
}

void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.println("Connecting to MQTT...");
    
    if (mqttClient.connect(deviceId.c_str(), mqttUsername, mqttPassword)) {
      Serial.println("MQTT Connected");
      
      // Subscribe to control topic
      mqttClient.subscribe(controlTopic.c_str());
      
      // Send DEVICE_CONNECT message
      DynamicJsonDocument doc(1024);
      doc["command"] = "device_connect";  // Using CommandTypeEnum
      doc["deviceInfo"] = {
        "id": deviceId,
        "name": deviceName,
        "type": deviceType,
        "ipAddress": WiFi.localIP().toString(),
        "macAddress": WiFi.macAddress()
      };
      doc["timestamp"] = getISOTimestamp();
      
      String message;
      serializeJson(doc, message);
      mqttClient.publish(statusTopic.c_str(), message.c_str());
      
      // Send initial status
      publishStatus();
    } else {
      Serial.println("MQTT Connection failed, retrying in 5 seconds");
      delay(5000);
    }
  }
}

void handleMQTTMessage(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  if (doc.containsKey("command")) {
    String command = doc["command"];
    
    if (command == "set_status") {
      bool value = doc["value"];
      // Update device status
      digitalWrite(LED_BUILTIN, value ? HIGH : LOW);
      publishStatus();
    }
    else if (command == "get_status") {
      publishStatus();
    }
  }
}

void publishStatus() {
  DynamicJsonDocument doc(1024);
  doc["status"] = "online";
  doc["timestamp"] = getISOTimestamp();
  
  String message;
  serializeJson(doc, message);
  mqttClient.publish(statusTopic.c_str(), message.c_str());
}

String getISOTimestamp() {
  // Implementation for getting ISO timestamp
  return "2024-01-01T12:00:00Z";  // Replace with actual timestamp
}

void loop() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();
  
  // Send periodic status updates every 30 seconds
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 30000) {
    publishStatus();
    lastUpdate = millis();
  }
}
```

### 2. Message Examples

#### Device Connection
```json
// Topic: home/room123/device456/status
{
  "command": "device_connect",
  "deviceInfo": {
    "id": "device456",
    "name": "Living Room Light",
    "type": "light",
    "ipAddress": "192.168.1.100",
    "macAddress": "00:1B:44:11:3A:B7"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### Status Update
```json
// Topic: home/room123/device456/status
{
  "status": "online",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### Control Command
```json
// Topic: home/room123/device456/control
{
  "command": "set_status",
  "value": true,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 3. Key Features

1. **Topic Structure**
   - Follows `home/{roomId}/{deviceId}/{type}` format
   - Supports status, control, data, and error topics

2. **Command Types**
   - Uses standard CommandTypeEnum values
   - Supports device_connect, set_status, get_status, etc.

3. **Message Format**
   - Standard JSON structure
   - Includes required timestamp field
   - Follows ICommandMessage and IStatusMessage interfaces

4. **Security**
   - API authentication for device configuration
   - MQTT credentials for broker connection
   - Secure topic structure with room and device isolation

## API Documentation

### Device Endpoints

- `GET /devices` - Get all devices
- `GET /devices/:id` - Get device by ID
- `GET /devices/controller/:controllerId` - Get devices by controller
- `POST /devices` - Create new device
- `PUT /devices/:id` - Update device
- `DELETE /devices/:id` - Delete device

### Room Endpoints

- `GET /rooms` - Get all rooms
- `GET /rooms/:id` - Get room by ID
- `POST /rooms` - Create new room
- `PUT /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room

### User Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

## MQTT Topics

### Device Topics
- `home/{roomId}/{deviceId}/status` - Device status updates
- `home/{roomId}/{deviceId}/control` - Device control commands
- `home/{roomId}/{deviceId}/data` - Device sensor data
- `home/{roomId}/{deviceId}/error` - Device error reports
- `home/{roomId}/{deviceId}/config` - Device configuration

### Broadcast Topics
- `home/broadcast` - System-wide broadcasts
- `home/{roomId}/broadcast` - Room-wide broadcasts

## Environment Variables

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smarthome

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# MQTT
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_WS_PORT=8883
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=mqtt_password
```

## Project Structure

```
src/
├── common/          # Common utilities and middleware
├── config/          # Configuration modules
├── database/        # Database configurations and migrations
├── modules/
│   ├── auth/        # Authentication module
│   ├── device/      # Device management
│   ├── mqtt/        # MQTT integration
│   ├── room/        # Room management
│   └── user/        # User management
├── app.module.ts    # Main application module
└── main.ts         # Application entry point
```

## Security

- All endpoints are protected with JWT authentication
- MQTT connections require valid credentials
- Device communication is encrypted with TLS
- Input validation on all endpoints
- Rate limiting for API and MQTT connections

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
