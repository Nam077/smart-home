import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IBaseOptions, ICsalContext } from '@app/common/interfaces/crud.interface';
import { BaseCrudService } from '@app/common/services/base-crud.service';
import { CreateDeviceDto } from '@app/modules/device/dto/create-device.dto';
import { RoomService } from '@app/modules/room/services/room.service';
import { UserService } from '@app/modules/user/services/user.service';

import { Device } from '../entities/device.entity';

@Injectable()
export class DeviceService extends BaseCrudService<Device> {
    constructor(
        @InjectRepository(Device)
        private readonly deviceRepository: Repository<Device>,
        private readonly userService: UserService,
        private readonly roomService: RoomService,
    ) {
        super(deviceRepository);
    }

    async findByRoomId(roomId: string): Promise<Device[]> {
        return await this.findAll({ where: { room: { id: roomId } }, relations: ['room'] });
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
}
