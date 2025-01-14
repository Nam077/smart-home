import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Controller } from '@app/modules/controller/entities/controller.entity';
import { Room } from '@app/modules/room/entities/room.entity';
import { IBaseEntity } from '@interfaces/crud.interface';
import { User } from '@modules/user/entities/user.entity';

export enum DeviceTypeEnum {
    SENSOR = 'sensor',
    ACTUATOR = 'actuator',
}

export enum DeviceFunctionEnum {
    // Actuator (Bộ điều khiển)
    RELAY_SIMPLE = 'relaySimple', // Điều khiển thiết bị trong nhà
    DOOR_CONTROL = 'doorControl', // Điều khiển cửa: mở/đóng, khóa cửa
    GARAGE_DOOR_CONTROL = 'garageDoorControl', // Điều khiển cửa garage: mở/đóng, khóa cửa
    DRYING_RACK_CONTROL = 'dryingRack', // Điều khiển giàn phơi: mở/đóng, hẹn giờ
    CANOPY_CONTROL = 'canopyControl', // Điều khiển mái hiên: mở/đóng, hẹn giờ
    SIREN_CONTROL = 'sirenControl', // Điều khiển còi báo động: bật/tắt, hẹn giờ
    GARDEN_CONTROL = 'gardenControl', // Điều khiển thiết bị vườn: tưới cây, bơm nước

    // Kitchen control (Nhà bếp)
    KITCHEN_CONTROL = 'kitchenControl', // Điều khiển thiết bị nhà bếp
    KITCHEN_LIGHT_CONTROL = 'kitchenLightControl', // Điều khiển đèn nhà bếp
    KITCHEN_FAN_CONTROL = 'kitchenFanControl', // Điều khiển quạt nhà bếp

    // Living room control (Phòng khách)
    LIVING_ROOM_CONTROL = 'livingRoomControl', // Điều khiển thiết bị phòng khách
    LIVING_ROOM_LIGHT_CONTROL = 'livingRoomLightControl', // Điều khiển đèn phòng khách
    LIVING_ROOM_FAN_CONTROL = 'livingRoomFanControl', // Điều khiển quạt phòng khách
    AIR_CONDITIONING_CONTROL = 'airConditioningControl', // Điều khiển điều hòa

    // Bedroom control (Phòng ngủ)
    BEDROOM_CONTROL = 'bedroomControl', // Điều khiển thiết bị phòng ngủ
    BEDROOM_LIGHT_CONTROL = 'bedroomLightControl', // Điều khiển đèn phòng ngủ
    BEDROOM_FAN_CONTROL = 'bedroomFanControl', // Điều khiển quạt phòng ngủ
    BEDROOM_AIR_CONDITIONING_CONTROL = 'bedroomAirConditioningControl', // Điều khiển điều hòa phòng ngủ

    //// Sensor (Cảm biến)
    // Environment Sensors (Cảm biến môi trường)
    SENSOR_TEMPERATURE = 'sensorTemperature', // Cảm biến nhiệt độ
    SENSOR_HUMIDITY = 'sensorHumidity', // Cảm biến độ ẩm
    SENSOR_AIR_QUALITY = 'sensorAirQuality', // Cảm biến chất lượng không khí (CO2, PM2.5)

    // Safety Sensors (Cảm biến an toàn)
    SENSOR_SMOKE = 'sensorSmoke', // Cảm biến khói
    SENSOR_GAS = 'sensorGas', // Cảm biến khí gas
    SENSOR_WATER_LEAK = 'sensorWaterLeak', // Cảm biến rò rỉ nước
    SENSOR_CO = 'sensorCO', // Cảm biến khí CO

    // Security Sensors (Cảm biến an ninh)
    SENSOR_MOTION = 'sensorMotion', // Cảm biến chuyển động
    SENSOR_DOOR = 'sensorDoor', // Cảm biến cửa
    SENSOR_GLASS = 'sensorGlass', // Cảm biến vỡ kính
    SENSOR_VIBRATION = 'sensorVibration', // Cảm biến rung
    SENSOR_FLAME = 'sensorFlame', // Cảm biến lửa
    SENSOR_RAIN = 'sensorRain', // Cảm biến mưa

    // Light Sensors (Cảm biến ánh sáng)
    SENSOR_LIGHT = 'sensorLight', // Cảm biến ánh sáng
    SENSOR_UV = 'sensorUV', // Cảm biến tia UV

    // Dimmer (Điều chỉnh)
    DIMMER_BASIC = 'dimmerBasic', // Điều chỉnh cơ bản: đèn, quạt
    DIMMER_ADVANCED = 'dimmerAdvanced', // Điều chỉnh nâng cao: âm lượng, thiết bị sưởi

    // Climate Control (Điều khiển môi trường)
    CLIMATE_TEMPERATURE = 'climateTemperature', // Điều chỉnh nhiệt độ: điều hòa, máy sưởi
    CLIMATE_HUMIDITY = 'climateHumidity', // Điều chỉnh độ ẩm: máy hút ẩm, máy tạo độ ẩm

    // Curtain & Blinds (Rèm và cửa cuốn)
    CURTAIN_CONTROL = 'curtainControl', // Điều khiển rèm cơ bản: mở/đóng, điều chỉnh vị trí

    // Security (An ninh)
    SECURITY_MONITORING = 'securityMonitoring', // Giám sát: camera, cảm biến an ninh
    SECURITY_ACCESS = 'securityAccess', // Kiểm soát truy cập: khóa cửa, còi báo động

    // Appliances (Thiết bị gia dụng)
    APPLIANCE_KITCHEN = 'applianceKitchen', // Thiết bị nhà bếp: lò nướng, máy pha cà phê
    APPLIANCE_CLEANING = 'applianceCleaning', // Thiết bị dọn dẹp: máy giặt, máy sấy
    APPLIANCE_COOLING = 'applianceCooling', // Thiết bị làm mát: tủ lạnh, quạt

    // Entertainment (Giải trí)
    ENTERTAINMENT_CONTROL = 'entertainmentControl', // Điều khiển thiết bị giải trí: TV, loa

    // Energy Management (Quản lý năng lượng)
    ENERGY_MANAGEMENT = 'energyManagement', // Quản lý năng lượng: đo lường tiêu thụ

    // Water Management (Quản lý nước)
    WATER_CONTROL = 'waterControl', // Quản lý nước: tưới cây, bơm, van nước

    // Miscellaneous (Khác)
    DEVICE_MAINTENANCE = 'deviceMaintenance', // Bảo trì: cập nhật firmware
    DEVICE_AUTOMATION = 'deviceAutomation', // Tự động hóa: lên lịch, chế độ tự động
}

@Entity('devices')
export class Device extends BaseEntity implements IBaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'text',
        default: DeviceTypeEnum.ACTUATOR,
        comment: 'Loại thiết bị',
    })
    type: DeviceTypeEnum;

    @Column({
        type: 'text',
        default: DeviceFunctionEnum.RELAY_SIMPLE,
        comment: 'Chức năng thiết bị',
    })
    function: DeviceFunctionEnum;

    @Column({ type: 'text', nullable: true })
    controlPin?: string;

    @Column({ default: false })
    status: boolean;

    @Column({ type: 'float', nullable: true, default: 0 })
    value?: number;

    @Column({ type: 'text', nullable: true, default: '%' })
    unit?: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    ipAddress?: string;

    @Column({ nullable: true })
    port?: number;

    @Column({ nullable: true })
    macAddress?: string;

    @Column({ nullable: true })
    firmwareVersion?: string;

    @Column({ nullable: true })
    image?: string;

    @Column({ default: false })
    isOnline: boolean;

    @Column({ default: false })
    isConnected: boolean;

    @Column({ type: 'json', nullable: true })
    color?: {
        r: number;
        g: number;
        b: number;
    };

    @Column({ type: 'text', nullable: true })
    lastError?: string;

    @Column({ type: 'datetime', nullable: true })
    lastSeenAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    lastErrorAt?: Date;

    @Column({ type: 'text', nullable: true })
    manufacturer?: string;

    @Column({ type: 'text', nullable: true })
    model?: string;

    @Column({ type: 'text', nullable: true })
    serialNumber?: string;

    @Column({ type: 'json', nullable: true })
    config?: {
        updateInterval?: number;
        threshold?: number;
        [key: string]: any;
    };

    @ManyToOne(() => Room, (room) => room.devices)
    room: Room;

    @ManyToOne(() => Controller, (controller) => controller.devices)
    controller: Controller;

    @ManyToOne(() => User, (user) => user.devices)
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;
}
