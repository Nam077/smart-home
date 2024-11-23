import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomModule } from '@app/modules/room/room.module';
import { UserModule } from '@app/modules/user/user.module';

import { DeviceController } from './controllers/device.controller';
import { Device } from './entities/device.entity';
import { DeviceService } from './services/device.service';

@Module({
    imports: [TypeOrmModule.forFeature([Device]), UserModule, RoomModule],
    controllers: [DeviceController],
    providers: [DeviceService],
    exports: [DeviceService],
})
export class DeviceModule {}
