import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseCrudService } from '@app/common/services/base-crud.service';

import { Room } from '../entities/room.entity';

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
}
