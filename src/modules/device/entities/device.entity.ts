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
    RELAY = 'relay',
    SENSOR = 'sensor',
    DIMMER = 'dimmer',
    RGB = 'rgb',
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
        default: DeviceFunctionEnum.RELAY,
        comment: 'Chức năng thiết bị',
    })
    function: DeviceFunctionEnum;

    @Column({ type: 'text', nullable: true })
    controlPin?: string;

    @Column({ default: false })
    status: boolean;

    @Column({ type: 'float', nullable: true })
    value?: number;

    @Column({ type: 'text', nullable: true })
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

    @Column({ type: 'text', nullable: true })
    location?: string;

    @Column({ default: 0 })
    brightness: number;

    @Column({ type: 'float', nullable: true })
    temperature?: number;

    @Column({ type: 'float', nullable: true })
    humidity?: number;

    @Column({ type: 'float', nullable: true })
    speed?: number;

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
