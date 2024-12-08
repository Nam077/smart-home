import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomController } from './controllers/room.controller';
import { Room } from './entities/room.entity';
import { RoomService } from './services/room.service';
import { UserModule } from '@app/modules/user/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([Room]), UserModule],
    controllers: [RoomController],
    providers: [RoomService],
    exports: [RoomService],
})
export class RoomModule {}
