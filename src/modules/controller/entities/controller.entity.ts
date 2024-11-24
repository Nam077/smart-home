import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Device } from '@app/modules/device/entities/device.entity';
import { IBaseEntity } from '@interfaces/crud.interface';
import { User } from '@modules/user/entities/user.entity';

@Entity('controllers')
export class Controller extends BaseEntity implements IBaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    ipAddress?: string;

    @Column({ nullable: true })
    macAddress?: string;

    @Column({ nullable: true })
    firmwareVersion?: string;

    @Column({ default: false })
    isOnline: boolean;

    @Column({ default: false })
    isConnected: boolean;

    @Column({ type: 'text', nullable: true })
    lastError?: string;

    @Column({ type: 'datetime', nullable: true })
    lastSeenAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    lastErrorAt?: Date;

    @OneToMany(() => Device, (device) => device.controller)
    devices: Device[];

    @ManyToOne(() => User, (user) => user.controllers)
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
