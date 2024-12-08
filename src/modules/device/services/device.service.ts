import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IBaseOptions, ICsalContext } from '@app/common/interfaces/crud.interface';
import { BaseCrudService } from '@app/common/services/base-crud.service';
import { ControllerService } from '@app/modules/controller/services/controller.service';
import { CreateDeviceDto, CreateDeviceUserDto } from '@app/modules/device/dto/create-device.dto';
import { RoomService } from '@app/modules/room/services/room.service';
import { UserService } from '@app/modules/user/services/user.service';

import { Device } from '../entities/device.entity';
import { User } from '@app/modules/user/entities/user.entity';

@Injectable()
export class DeviceService extends BaseCrudService<Device> {
    constructor(
        @InjectRepository(Device)
        private readonly deviceRepository: Repository<Device>,
        private readonly userService: UserService,
        private readonly roomService: RoomService,
        private readonly controllerService: ControllerService,
    ) {
        super(deviceRepository);
    }

    async findByRoomId(roomId: string): Promise<Device[]> {
        return await this.findAll({ where: { room: { id: roomId } }, relations: ['room'] });
    }

    async getRoomIdByDeviceId(deviceId: string): Promise<string | null> {
        const device = await this.deviceRepository.findOne({
            where: { id: deviceId },
            relations: ['room'],
        });

        return device?.room?.id || null;
    }

    async findByControllerId(controllerId: string, user: User): Promise<Device[]> {
        const controller = await this.controllerService.findOne({ where: { id: controllerId , user: { id: user.id } } });
        
        if (!controller) {
            throw new NotFoundException(`Controller not found: ${controllerId}`);
        }

        return await this.findAll({
            where: { controller: { id: controllerId } },
            relations: {
                room: true,
                controller: true
            }
        });
    }

    protected get getEntityName(): string {
        return this.deviceRepository.metadata.name;
    }

    override async create(
        createDeviceDto: CreateDeviceDto,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<Device> {
        const room = await this.roomService.findById(createDeviceDto.roomId);
        const user = await this.userService.findById(createDeviceDto.userId);
        const controller = await this.controllerService.findById(createDeviceDto.controllerId);

        if (!controller) {
            throw new NotFoundException(`Controller not found: ${createDeviceDto.controllerId}`);
        }

        if (!room) {
            throw new NotFoundException(`Room not found: ${createDeviceDto.roomId}`);
        }

        if (!user) {
            throw new NotFoundException(`User not found: ${createDeviceDto.userId}`);
        }

        return this.transaction(async (queryRunner) => {
            const device = this.deviceRepository.create(createDeviceDto);

            device.room = room;
            device.user = user;
            device.controller = controller;

            if (this.hooks?.beforeCreate) {
                await this.hooks.beforeCreate(device, context);
            }

            await queryRunner.manager.save(device);

            if (this.hooks?.afterCreate) {
                await this.hooks.afterCreate(device, context);
            }

            return device;
        });
    }
    async createForUser(
        createDeviceDto: CreateDeviceUserDto,
        currentUser: User,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<Device> {
        const room = await this.roomService.findById(createDeviceDto.roomId);
        const user = await this.userService.findById(currentUser.id);
        const controller = await this.controllerService.findById(createDeviceDto.controllerId);

        if (!controller) {
            throw new NotFoundException(`Controller not found: ${createDeviceDto.controllerId}`);
        }

        if (!room) {
            throw new NotFoundException(`Room not found: ${createDeviceDto.roomId}`);
        }

        if (!user) {
            throw new NotFoundException(`User not found: ${currentUser.id}`);
        }

        return this.transaction(async (queryRunner) => {
            const device = this.deviceRepository.create(createDeviceDto);

            device.room = room;
            device.user = user;
            device.controller = controller;

            if (this.hooks?.beforeCreate) {
                await this.hooks.beforeCreate(device, context);
            }

            await queryRunner.manager.save(device);

            if (this.hooks?.afterCreate) {
                await this.hooks.afterCreate(device, context);
            }

            return device;
        });
    }
    override async update(id: string, updateDeviceDto: any): Promise<Device> {
        return this.transaction(async (queryRunner) => {
            const device = await this.findOne({
                where: { id },
                relations: {
                    room: true,
                    controller: true,
                    user: true
                }
            });

            if (!device) {
                throw new NotFoundException(`Device not found: ${id}`);
            }

            if (updateDeviceDto.roomId && device.room.id !== updateDeviceDto.roomId) {
                const room = await this.roomService.findById(updateDeviceDto.roomId);
                device.room = room;
            }
            if (updateDeviceDto.controllerId && device.controller.id !== updateDeviceDto.controllerId) {
                const controller = await this.controllerService.findById(updateDeviceDto.controllerId);
                device.controller = controller;
            }
            if (updateDeviceDto.userId && device.user.id !== updateDeviceDto.userId) {
                const user = await this.userService.findById(updateDeviceDto.userId);
                device.user = user;
            }

            if (this.hooks?.beforeUpdate) {
                await this.hooks.beforeUpdate(id, updateDeviceDto)
            }

            await queryRunner.manager.save(device);

            if (this.hooks?.afterUpdate) {
                await this.hooks.afterUpdate(device);
            }

            return device;


        });
    }
}
