import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseCrudService } from '@app/common/services/base-crud.service';

import { Device } from '../entities/device.entity';

@Injectable()
export class DeviceService extends BaseCrudService<Device> {
    constructor(
        @InjectRepository(Device)
        private readonly deviceRepository: Repository<Device>,
    ) {
        super(deviceRepository);
    }

    protected get getEntityName(): string {
        return this.deviceRepository.metadata.name;
    }
}
