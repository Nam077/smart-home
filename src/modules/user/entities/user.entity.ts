import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    BeforeInsert,
    BeforeUpdate,
    OneToMany,
} from 'typeorm';

import { Device } from '@app/modules/device/entities/device.entity';
import { Room } from '@app/modules/room/entities/room.entity';
import { Controller } from '@app/modules/controller/entities/controller.entity';
import { IBaseEntity } from '@interfaces/crud.interface';

@Entity('users')
export class User implements IBaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @Column({ unique: true })
    @IsNotEmpty()
    @MinLength(3)
    username: string;

    @Column()
    @IsNotEmpty()
    @MinLength(8)
    @Exclude()
    password: string;

    @Column({ nullable: true })
    firstName?: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;

    @OneToMany(() => Device, (device) => device.user)
    devices: Device[];

    @OneToMany(() => Controller, (controller) => controller.user)
    controllers: Controller[];

    @OneToMany(() => Room, (room) => room.user)
    rooms: Room[];

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password) {
            const salt = await bcrypt.genSalt();

            this.password = await bcrypt.hash(this.password, salt);
        }
    }

    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}
