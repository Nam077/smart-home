import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseCrudService } from '@app/common/services/base-crud.service';

import { Room } from '../entities/room.entity';
import { CreateRoomDto, CreateRoomUserDto } from '@app/modules/room/dto/create-room.dto';
import { IBaseOptions, ICsalContext } from '@app/common/interfaces/crud.interface';
import { Controller } from '@nestjs/common/interfaces';
import { User } from '@app/modules/user/entities/user.entity';
import { UserService } from '@app/modules/user/services/user.service';

@Injectable()
export class RoomService extends BaseCrudService<Room> {
    

    constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
        private readonly userService: UserService
    ) {
        super(roomRepository);
    }

    protected get getEntityName(): string {
        return this.roomRepository.metadata.name;
    }

    async findByUserId(id: string): Promise<Room[]> {
        console.log(id);
        
        return await this.roomRepository.find({
            where: {
                user: {
                    id,
                },
            },
        });
    }
    override async create(
        createRoomDto: CreateRoomDto,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<Room> {
        const user = await this.userService.findById(createRoomDto.userId);

        if (!user) {
            throw new NotFoundException(`User not found: ${createRoomDto.userId}`);
        }

        return await this.transaction(async (queryRunner) => {
            const room = this.roomRepository.create(createRoomDto);
            room.user = user;

            if (this.hooks?.beforeCreate) {
                await this.hooks.beforeCreate(room, context);
            }

            const savedRoom = await queryRunner.manager.save(room);

            if (this.hooks?.afterCreate) {
                await this.hooks.afterCreate(savedRoom, context);
            }

            return savedRoom;
        });
    }

    async createForUser(createRoomDto: CreateRoomUserDto, user: User): Promise<Room> {
        
        return await this.create({ ...createRoomDto, userId: user.id });
    }

    async getCountDevicesByRoomId(roomId: string): Promise<number> {
       const room = await this.findOne({
           where: {
               id: roomId
           },
           relations: {
               devices: true
           }
       })
       return room.devices.length;
    }

   async softDeleteByUserId(id: string, user: User): Promise<Room> {
        const room = await this.findOne({ where: { id, user: { id: user.id } } });
        if (!room) {
            throw new NotFoundException(`Room not found: ${id}`);
        }

        return await this.transaction(async (queryRunner) => {
            await queryRunner.manager.softRemove(room);
            return room;
        });

        
    }
}
