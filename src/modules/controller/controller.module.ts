import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '@app/modules/user/user.module';

import { ControllerController } from './controllers/controller.controller';
import { Controller } from './entities/controller.entity';
import { ControllerService } from './services/controller.service';

@Module({
    imports: [TypeOrmModule.forFeature([Controller]), UserModule],
    controllers: [ControllerController],
    providers: [ControllerService],
    exports: [ControllerService],
})
export class ControllerModule {}
