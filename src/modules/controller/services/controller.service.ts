import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IBaseOptions, ICsalContext } from '@app/common/interfaces/crud.interface';
import { BaseCrudService } from '@app/common/services/base-crud.service';
import { UserService } from '@app/modules/user/services/user.service';

import { CreateControllerDto, CreateControllerForUserDto } from '../dto/create-controller.dto';
import { Controller } from '../entities/controller.entity';
import { User } from '@app/modules/user/entities/user.entity';

@Injectable()
export class ControllerService extends BaseCrudService<Controller> {
    constructor(
        @InjectRepository(Controller)
        private readonly controllerRepository: Repository<Controller>,
        private readonly userService: UserService,
    ) {
        super(controllerRepository);
    }

    async findByUserId(userId: string): Promise<Controller[]> {
        return await this.findAll({ where: { user: { id: userId } }, relations: ['user', 'devices'] });
    }

    async findByDeviceId(deviceId: string): Promise<Controller | null> {
        return await this.controllerRepository.findOne({
            where: { devices: { id: deviceId } },
            relations: ['devices'],
        });
    }

    protected get getEntityName(): string {
        return this.controllerRepository.metadata.name;
    }

    override async create(
        createControllerDto: CreateControllerDto,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<Controller> {
        const user = await this.userService.findById(createControllerDto.userId);

        if (!user) {
            throw new NotFoundException(`User not found: ${createControllerDto.userId}`);
        }

        const controller = this.controllerRepository.create({
            ...createControllerDto,
            user,
        });

        return await this.controllerRepository.save(controller);
    }

    async createForUser(createControllerDto: CreateControllerForUserDto, user: User): Promise<Controller> {
        return this.create({ ...createControllerDto, userId: user.id });
    }

    async updateOnlineStatus(id: string, isOnline: boolean): Promise<Controller> {
        const controller = await this.findById(id);

        if (!controller) {
            throw new NotFoundException(`Controller not found: ${id}`);
        }

        controller.isOnline = isOnline;
        controller.lastSeenAt = new Date();

        return await this.controllerRepository.save(controller);
    }

    async updateConnectionStatus(id: string, isConnected: boolean): Promise<Controller> {
        const controller = await this.findById(id);

        if (!controller) {
            throw new NotFoundException(`Controller not found: ${id}`);
        }

        controller.isConnected = isConnected;
        controller.lastSeenAt = new Date();

        if (!isConnected) {
            controller.isOnline = false;
        }

        return await this.controllerRepository.save(controller);
    }

    async updateLastError(id: string, error: string): Promise<Controller> {
        const controller = await this.findById(id);

        if (!controller) {
            throw new NotFoundException(`Controller not found: ${id}`);
        }

        controller.lastError = error;
        controller.lastErrorAt = new Date();

        return await this.controllerRepository.save(controller);
    }
}
