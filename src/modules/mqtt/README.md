# Module MQTT

Module NestJS triển khai chức năng MQTT broker và client để giao tiếp với các thiết bị IoT trong hệ thống nhà thông minh.

## Tổng Quan

Module này cung cấp giải pháp MQTT hoàn chỉnh với broker tích hợp sẵn, quản lý thiết bị và khả năng giao tiếp thời gian thực.

## Tính Năng

- MQTT broker tích hợp sử dụng Aedes
- Hỗ trợ kết nối TCP và WebSocket
- Xác thực và phân quyền thiết bị
- Theo dõi kết nối thiết bị tự động
- Giám sát heartbeat
- Nhắn tin broadcast và unicast
- Nhóm thiết bị theo phòng

## Cài Đặt

```bash
npm install aedes aedes-server-factory
```

## Cấu Hình

Tạo file `.env` với các cài đặt MQTT sau:

```env
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_WS_PORT=8883
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=mqtt_password
```

## Cấu Trúc Module

```
mqtt/
├── dto/                    # Các đối tượng truyền dữ liệu
│   └── device-control.dto.ts
├── interfaces/            # Các interface
│   └── mqtt-publisher.interface.ts
├── services/             # Các service
│   ├── mqtt-handler.service.ts
│   ├── mqtt-heartbeat.service.ts
│   ├── mqtt-publisher.service.ts
│   └── mqtt-queue.service.ts
├── types/                # Kiểu dữ liệu và enum
│   └── mqtt.types.ts
├── mqtt.config.ts        # Cấu hình module
├── mqtt.controller.ts    # Các endpoint REST
├── mqtt.module.ts        # Định nghĩa module
└── mqtt.service.ts       # Service MQTT chính
```

## Cấu Trúc Topic

Topics theo định dạng: `home/{roomId}/{deviceId}/{type}`

Trong đó:
- `roomId`: ID của phòng chứa thiết bị
- `deviceId`: ID định danh của thiết bị
- `type`: Một trong các loại sau:
  - `status`: Cập nhật trạng thái thiết bị
  - `control`: Lệnh điều khiển thiết bị
  - `data`: Dữ liệu cảm biến
  - `error`: Thông báo lỗi thiết bị

### Chi Tiết Các Topic Điều Khiển

#### 1. Điều Khiển Thiết Bị (`home/{roomId}/{deviceId}/control`)

Dùng để gửi lệnh đến thiết bị cụ thể. Các lệnh điều khiển phổ biến:

**Điều Khiển Nguồn:**
```json
{
  "command": "set_status",
  "value": true,  // true = bật, false = tắt
  "timestamp": "2024-01-20T12:00:00Z"
}
```

**Điều Khiển Giá Trị:**
```json
{
  "command": "set_value",
  "value": 75,  // giá trị số (0-100)
  "unit": "%",  // đơn vị (tùy chọn)
  "timestamp": "2024-01-20T12:00:00Z"
}
```

**Điều Khiển Màu:**
```json
{
  "command": "set_color",
  "value": {
    "r": 255,
    "g": 128,
    "b": 0
  },
  "timestamp": "2024-01-20T12:00:00Z"
}
```

**Cập Nhật Cấu Hình:**
```json
{
  "command": "update_config",
  "value": {
    "updateInterval": 5000,
    "threshold": 0.5
  },
  "timestamp": "2024-01-20T12:00:00Z"
}
```

#### 2. Broadcast Phòng (`home/{roomId}/broadcast`)

Dùng để gửi lệnh đến tất cả thiết bị trong phòng:

**Tắt Tất Cả:**
```json
{
  "command": "turn_off_all",
  "timestamp": "2024-01-20T12:00:00Z"
}
```

**Bật Tất Cả:**
```json
{
  "command": "turn_on_all",
  "timestamp": "2024-01-20T12:00:00Z"
}
```

#### 3. Trạng Thái Thiết Bị (`home/{roomId}/{deviceId}/status`)

Dùng để thiết bị báo cáo trạng thái:

**Trạng Thái Kết Nối:**
```json
{
  "command": "device_connect",
  "deviceInfo": {
    "ipAddress": "192.168.1.100",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "firmwareVersion": "1.0.0"
  },
  "timestamp": "2024-01-20T12:00:00Z"
}
```

**Cập Nhật Trạng Thái Định Kỳ:**
```json
{
  "status": true,
  "value": 75,
  "brightness": 80,
  "temperature": 25.5,
  "humidity": 60,
  "isOnline": true,
  "isConnected": true,
  "lastError": null,
  "timestamp": "2024-01-20T12:00:00Z"
}
```

#### 4. Dữ Liệu Thiết Bị (`home/{roomId}/{deviceId}/data`)

Dùng cho dữ liệu cảm biến và đo lường:

**Đọc Cảm Biến:**
```json
{
  "measurements": {
    "temperature": 25.5,
    "humidity": 60,
    "pressure": 1013.25
  },
  "battery": 85,
  "rssi": -65,
  "timestamp": "2024-01-20T12:00:00Z"
}
```

#### 5. Báo Lỗi (`home/{roomId}/{deviceId}/error`)

Dùng để báo cáo lỗi thiết bị:

```json
{
  "code": "E001",
  "message": "Lỗi đọc cảm biến",
  "severity": "error",
  "details": {
    "sensor": "temperature",
    "attempt": 3
  },
  "timestamp": "2024-01-20T12:00:00Z"
}
```

### Ký Tự Đại Diện Topic

- Một cấp: `+`
- Nhiều cấp: `#`

Ví dụ:
- `home/+/+/status`: Theo dõi trạng thái của tất cả thiết bị
- `home/{roomId}/+/error`: Theo dõi lỗi của tất cả thiết bị trong phòng
- `home/{roomId}/{deviceId}/#`: Theo dõi tất cả tin nhắn của một thiết bị

## Các Loại Lệnh

```typescript
enum CommandTypeEnum {
  // Lệnh Broadcast
  TURN_OFF_ALL = 'turn_off_all',
  TURN_ON_ALL = 'turn_on_all',

  // Lệnh Kết Nối
  DEVICE_CONNECT = 'device_connect',
  DEVICE_DISCONNECT = 'device_disconnect',

  // Lệnh Unicast
  SET_STATUS = 'set_status',
  SET_VALUE = 'set_value', 
  SET_COLOR = 'set_color',
  GET_STATUS = 'get_status',
  GET_INFO = 'get_info',

  // Lệnh Cấu Hình
  UPDATE_CONFIG = 'update_config',
  SYNC_TIME = 'sync_time'
}
```

## DTOs

- **DeviceControlBaseDto**: DTO cơ sở cho lệnh điều khiển thiết bị
```typescript
export class DeviceControlBaseDto {
    @IsUUID()
    deviceId: string;

    @IsUUID()
    roomId: string;

    @IsEnum(CommandTypeEnum)
    command: CommandTypeEnum;
}
```

- **DeviceStatusControlDto**: Cho điều khiển trạng thái (bật/tắt)
- **DeviceValueControlDto**: Cho điều khiển giá trị số
- **DeviceColorControlDto**: Cho điều khiển màu RGB
- **DeviceConfigControlDto**: Cho cấu hình thiết bị
- **DeviceStatusResponseDto**: Cho phản hồi trạng thái thiết bị

## Ví Dụ Sử Dụng

### 1. Gửi Lệnh Điều Khiển

```typescript
// Inject MQTT service
constructor(private readonly mqttService: MqttService) {}

// Bật thiết bị
await mqttService.publishControl(deviceId, {
  command: CommandTypeEnum.SET_STATUS,
  value: true
});

// Đặt độ sáng
await mqttService.publishControl(deviceId, {
  command: CommandTypeEnum.SET_VALUE,
  value: 75
});
```

### 2. Broadcast Đến Phòng

```typescript
// Inject MQTT publisher service
constructor(private readonly mqttPublisher: MqttPublisherService) {}

// Tắt tất cả thiết bị trong phòng
await mqttPublisher.broadcastToRoom(roomId, CommandTypeEnum.TURN_OFF_ALL);
```

### 3. Cấu Hình Thiết Bị

```typescript
// Cập nhật cấu hình thiết bị
await mqttService.publishControl(deviceId, {
  command: CommandTypeEnum.UPDATE_CONFIG,
  value: {
    updateInterval: 5000,
    threshold: 0.5
  }
});
```

## Tính Năng Bảo Mật

1. **Xác Thực**
   - Username/password cho kết nối MQTT
   - JWT cho REST API endpoints

2. **Kiểm Soát Truy Cập**
   - Kiểm soát truy cập theo topic
   - Cô lập thiết bị theo phòng

3. **Giám Sát**
   - Theo dõi kết nối
   - Kiểm tra heartbeat thiết bị
   - Ghi log lỗi

## Xử Lý Lỗi

Module bao gồm xử lý lỗi toàn diện:
- Lỗi kết nối
- Kiểm tra tin nhắn
- Phát hiện timeout thiết bị
- Kiểm tra lệnh
- Kiểm tra cấu hình

## Đóng Góp

1. Fork repository
2. Tạo nhánh tính năng (`git checkout -b feature/tinh-nang-moi`)
3. Commit thay đổi (`git commit -m 'Thêm tính năng mới'`)
4. Push lên nhánh (`git push origin feature/tinh-nang-moi`)
5. Tạo Pull Request

## Giấy Phép

Module này là một phần của dự án Smart Home Backend và được cấp phép theo giấy phép MIT. 