import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseCrudService } from '@app/common/services/base-crud.service';

import { Room } from '../entities/room.entity';
import { CreateRoomDto, CreateRoomUserDto } from '@app/modules/room/dto/create-room.dto';
import { IBaseOptions, ICsalContext } from '@app/common/interfaces/crud.interface';
import { Controller } from '@nestjs/common/interfaces';
import { User } from '@app/modules/user/entities/user.entity';

@Injectable()
export class RoomService extends BaseCrudService<Room> {
    constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
    ) {
        super(roomRepository);
    }

    protected get getEntityName(): string {
        return this.roomRepository.metadata.name;
    }

    override async create(
        createRoomDto: CreateRoomDto,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<Room> {
        const user = await this.findById(createRoomDto.userId);

        if (!user) {
            throw new NotFoundException(`User not found: ${createRoomDto.userId}`);
        }

        const room = this.roomRepository.create({
            ...createRoomDto,
            user,
        });

        return await this.roomRepository.save(room);
    }

    async createForUser(createRoomDto: CreateRoomUserDto, user: User): Promise<Room> {
        return this.create({ ...createRoomDto, userId: user.id });
    }
}
