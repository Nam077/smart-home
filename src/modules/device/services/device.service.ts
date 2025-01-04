import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IBaseOptions, ICsalContext } from '@app/common/interfaces/crud.interface';
import { BaseCrudService } from '@app/common/services/base-crud.service';
import { ControllerService } from '@app/modules/controller/services/controller.service';
import { CreateDeviceDto, CreateDeviceUserDto } from '@app/modules/device/dto/create-device.dto';
import { RoomService } from '@app/modules/room/services/room.service';
import { User } from '@app/modules/user/entities/user.entity';
import { UserService } from '@app/modules/user/services/user.service';

import { Device } from '../entities/device.entity';

@Injectable()
export class DeviceService extends BaseCrudService<Device> {
    [x: string]: any;
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
        const controller = await this.controllerService.findOne({ where: { id: controllerId, user: { id: user.id } } });

        if (!controller) {
            throw new NotFoundException(`Controller not found: ${controllerId}`);
        }

        return await this.findAll({
            where: { controller: { id: controllerId } },
            relations: {
                room: true,
                controller: true,
            },
        });
    }

    async findDeviceByControllerId(controllerId: string): Promise<Device[]> {
        const controller = await this.controllerService.findOne({ where: { id: controllerId } });

        if (!controller) {
            throw new NotFoundException(`Controller not found: ${controllerId}`);
        }

        return await this.findAll({
            where: { controller: { id: controllerId } },
            relations: {
                room: true,
            },
        });
    }

    async findDeviceByControllerId2(controllerId: string): Promise<Device[] | any> {
        const controller = await this.controllerService.findOne({ where: { id: controllerId } });

        if (!controller) {
            throw new NotFoundException(`Controller not found: ${controllerId}`);
        }

        const devices: Device[] = await this.findAll({
            where: { controller: { id: controllerId } },
            relations: {
                room: true,
            },
        });

        return devices.map((device) => {
            return {
                id: device.id,
                name: device.name,
                type: device.type,
                function: device.function,
                controlPin: device.controlPin,
                idRoom: device.room.id,
                status: device.status,
            };
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
                    user: true,
                },
            });

            if (!device) {
                throw new NotFoundException(`Device not found: ${id}`);
            }

            // Handle relations updates
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

            // Update basic fields
            const updateableFields = [
                'name',
                'type',
                'function',
                'controlPin',
                'status',
                'value',
                'unit',
                'description',
                'ipAddress',
                'port',
                'macAddress',
                'firmwareVersion',
                'image',
                'isOnline',
                'isConnected',
                'color',
                'lastError',
                'lastSeenAt',
                'lastErrorAt',
                'manufacturer',
                'model',
                'serialNumber',
                'config',
            ];

            updateableFields.forEach((field) => {
                if (updateDeviceDto[field] !== undefined) {
                    device[field] = updateDeviceDto[field];
                }
            });

            if (this.hooks?.beforeUpdate) {
                await this.hooks.beforeUpdate(id, updateDeviceDto);
            }

            const updatedDevice = await queryRunner.manager.save(device);

            if (this.hooks?.afterUpdate) {
                await this.hooks.afterUpdate(updatedDevice);
            }

            return updatedDevice;
        });
    }

    async save(device: Device): Promise<Device> {
        return this.deviceRepository.save(device);
    }

    async saveMany(devices: Device[]): Promise<Device[]> {
        return this.deviceRepository.save(devices);
    }
}
