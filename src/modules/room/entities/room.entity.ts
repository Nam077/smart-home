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

import { IBaseEntity } from '@app/common/interfaces/crud.interface';
import { Device } from '@app/modules/device/entities/device.entity';
import { User } from '@app/modules/user/entities/user.entity';

@Entity('rooms')
export class Room extends BaseEntity implements IBaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    floor?: number;

    @Column({ nullable: true })
    area?: number;

    @Column({ nullable: true })
    image?: string;

    @ManyToOne(() => User, (user) => user.rooms)
    user: User;

    @OneToMany(() => Device, (device) => device.room)
    devices: Device[];
}
