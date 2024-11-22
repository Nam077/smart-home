import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceController } from './controllers/device.controller';
import { Device } from './entities/device.entity';
import { DeviceService } from './services/device.service';

@Module({
    imports: [TypeOrmModule.forFeature([Device])],
    controllers: [DeviceController],
    providers: [DeviceService],
    exports: [DeviceService],
})
export class DeviceModule {}
