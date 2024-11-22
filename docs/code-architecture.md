# Smart Home Backend Code Architecture

## Module Structure

```mermaid
classDiagram
    class AppModule {
        +imports: [ConfigModule, AuthModule, DeviceModule, MQTTModule, RoomModule, UserModule]
        +controllers: [AppController]
        +providers: [AppService]
    }

    class ConfigModule {
        +load(): ConfigurationInterface
        +validate(): void
    }

    class AuthModule {
        +imports: [JwtModule, UserModule]
        +controllers: [AuthController]
        +providers: [AuthService, JwtStrategy]
    }

    class DeviceModule {
        +imports: [MQTTModule]
        +controllers: [DeviceController]
        +providers: [DeviceService]
        +exports: [DeviceService]
    }

    class MQTTModule {
        +controllers: [MQTTController]
        +providers: [MQTTService]
        +exports: [MQTTService]
    }

    class RoomModule {
        +controllers: [RoomController]
        +providers: [RoomService]
    }

    class UserModule {
        +controllers: [UserController]
        +providers: [UserService]
        +exports: [UserService]
    }

    AppModule --> ConfigModule
    AppModule --> AuthModule
    AppModule --> DeviceModule
    AppModule --> MQTTModule
    AppModule --> RoomModule
    AppModule --> UserModule
```

## Service Layer

```mermaid
classDiagram
    class AuthService {
        -jwtService: JwtService
        -userService: UserService
        +validateUser(username: string, password: string): Promise<User>
        +login(user: User): Promise<LoginResponse>
        +register(createUserDto: CreateUserDto): Promise<User>
    }

    class DeviceService {
        -mqttService: MQTTService
        -deviceRepository: Repository<Device>
        +create(createDeviceDto: CreateDeviceDto): Promise<Device>
        +findAll(): Promise<Device[]>
        +findOne(id: string): Promise<Device>
        +update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<Device>
        +remove(id: string): Promise<void>
        +updateStatus(id: string, status: DeviceStatus): Promise<Device>
        +control(id: string, command: DeviceCommand): Promise<void>
    }

    class MQTTService {
        -broker: AedesBroker
        -deviceService: DeviceService
        -clients: Map<string, MQTTClient>
        +onModuleInit(): void
        +handleConnection(client: MQTTClient): void
        +handleDisconnect(client: MQTTClient): void
        +handleMessage(packet: PublishPacket, client: MQTTClient): void
        +publishStatus(deviceId: string, status: DeviceStatus): void
        +publishCommand(deviceId: string, command: DeviceCommand): void
        -authenticate(client: MQTTClient): boolean
        -handleDeviceStatus(deviceId: string, payload: any): void
        -handleDeviceData(deviceId: string, payload: any): void
    }

    class RoomService {
        -roomRepository: Repository<Room>
        +create(createRoomDto: CreateRoomDto): Promise<Room>
        +findAll(): Promise<Room[]>
        +findOne(id: string): Promise<Room>
        +update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room>
        +remove(id: string): Promise<void>
        +addDevice(roomId: string, deviceId: string): Promise<Room>
        +removeDevice(roomId: string, deviceId: string): Promise<Room>
    }

    class UserService {
        -userRepository: Repository<User>
        +create(createUserDto: CreateUserDto): Promise<User>
        +findAll(): Promise<User[]>
        +findOne(id: string): Promise<User>
        +findByUsername(username: string): Promise<User>
        +update(id: string, updateUserDto: UpdateUserDto): Promise<User>
        +remove(id: string): Promise<void>
    }

    DeviceService --> MQTTService
    AuthService --> UserService
```

## Entity Relationships

```mermaid
classDiagram
    class User {
        +string id
        +string username
        +string password
        +string email
        +Date createdAt
        +Date updatedAt
        +devices: Device[]
        +rooms: Room[]
    }

    class Device {
        +string id
        +string name
        +string type
        +boolean status
        +number value
        +string unit
        +number brightness
        +number temperature
        +boolean isOnline
        +boolean isConnected
        +Date lastSeenAt
        +string lastError
        +User user
        +Room room
        +updateStatus(status: DeviceStatus): void
        +updateConnection(connected: boolean): void
    }

    class Room {
        +string id
        +string name
        +string description
        +User user
        +devices: Device[]
    }

    class DeviceStatus {
        +boolean status
        +number value
        +string unit
        +number brightness
        +number temperature
        +boolean isOnline
        +boolean isConnected
    }

    class DeviceCommand {
        +string command
        +any payload
    }

    User "1" -- "*" Device : owns
    User "1" -- "*" Room : owns
    Room "1" -- "*" Device : contains
    Device -- DeviceStatus : has
    Device -- DeviceCommand : receives
```

## MQTT Communication Flow

```mermaid
sequenceDiagram
    participant Device
    participant MQTTBroker as MQTT Broker
    participant MQTTService
    participant DeviceService
    participant Database
    participant Client as Web Client

    %% Device Connection
    Device->>MQTTBroker: Connect (clientId, username, password)
    MQTTBroker->>MQTTService: handleConnection(client)
    MQTTService->>MQTTService: authenticate(client)
    MQTTService->>DeviceService: updateConnection(deviceId, true)
    DeviceService->>Database: save connection status

    %% Device Status Update
    Device->>MQTTBroker: Publish (device/deviceId/status)
    MQTTBroker->>MQTTService: handleMessage(packet)
    MQTTService->>MQTTService: handleDeviceStatus(deviceId, payload)
    MQTTService->>DeviceService: updateStatus(deviceId, status)
    DeviceService->>Database: save device status
    MQTTService-->>Client: WebSocket Event (device.status)

    %% Device Control
    Client->>DeviceService: control(deviceId, command)
    DeviceService->>MQTTService: publishCommand(deviceId, command)
    MQTTService->>MQTTBroker: Publish (device/deviceId/control)
    MQTTBroker->>Device: Forward Command

    %% Device Data
    Device->>MQTTBroker: Publish (device/deviceId/data)
    MQTTBroker->>MQTTService: handleMessage(packet)
    MQTTService->>MQTTService: handleDeviceData(deviceId, payload)
    MQTTService->>DeviceService: processData(deviceId, data)
    DeviceService->>Database: save device data
    MQTTService-->>Client: WebSocket Event (device.data)

    %% Device Disconnection
    Device->>MQTTBroker: Disconnect
    MQTTBroker->>MQTTService: handleDisconnect(client)
    MQTTService->>DeviceService: updateConnection(deviceId, false)
    DeviceService->>Database: save connection status
    MQTTService-->>Client: WebSocket Event (device.disconnect)
```

## API Endpoints Structure

```mermaid
graph TD
    subgraph Auth
        A[POST /auth/login] --> AA[AuthController.login]
        B[POST /auth/register] --> BB[AuthController.register]
    end

    subgraph Devices
        C[GET /devices] --> CC[DeviceController.findAll]
        D[GET /devices/:id] --> DD[DeviceController.findOne]
        E[POST /devices] --> EE[DeviceController.create]
        F[PATCH /devices/:id] --> FF[DeviceController.update]
        G[DELETE /devices/:id] --> GG[DeviceController.remove]
        H[POST /devices/:id/control] --> HH[DeviceController.control]
    end

    subgraph Rooms
        I[GET /rooms] --> II[RoomController.findAll]
        J[GET /rooms/:id] --> JJ[RoomController.findOne]
        K[POST /rooms] --> KK[RoomController.create]
        L[PATCH /rooms/:id] --> LL[RoomController.update]
        M[DELETE /rooms/:id] --> MM[RoomController.remove]
        N[POST /rooms/:id/devices] --> NN[RoomController.addDevice]
        O[DELETE /rooms/:id/devices/:deviceId] --> OO[RoomController.removeDevice]
    end

    subgraph Users
        P[GET /users] --> PP[UserController.findAll]
        Q[GET /users/:id] --> QQ[UserController.findOne]
        R[PATCH /users/:id] --> RR[UserController.update]
        S[DELETE /users/:id] --> SS[UserController.remove]
    end
```

## WebSocket Events

```mermaid
graph LR
    subgraph Outgoing Events
        A[device.status] --> AA[Device status updates]
        B[device.data] --> BB[Device sensor data]
        C[device.connection] --> CC[Device connection state]
        D[device.error] --> DD[Device error events]
    end

    subgraph Incoming Events
        E[device.control] --> EE[Device control commands]
        F[device.query] --> FF[Device status queries]
    end
```

## Configuration Structure

```mermaid
graph TD
    subgraph Configuration
        A[ConfigurationInterface] --> B[AppConfig]
        A --> C[DatabaseConfig]
        A --> D[MQTTConfig]
        A --> E[JWTConfig]

        B --> BA[port: number]
        B --> BB[environment: string]

        C --> CA[host: string]
        C --> CB[port: number]
        C --> CC[username: string]
        C --> CD[password: string]
        C --> CE[database: string]

        D --> DA[port: number]
        D --> DB[host: string]
        D --> DC[wsPort: number]
        D --> DD[auth: boolean]

        E --> EA[secret: string]
        E --> EB[expiresIn: string]
    end
```
