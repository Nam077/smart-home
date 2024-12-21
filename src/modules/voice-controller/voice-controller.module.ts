import { Module } from '@nestjs/common';

import { DeviceModule } from '@app/modules/device/device.module';

import { VoiceControllerController } from './voice-controller.controller';
import { VoiceControllerService } from './voice-controller.service';

@Module({
    imports: [DeviceModule],
    controllers: [VoiceControllerController],
    providers: [VoiceControllerService],
})
export class VoiceControllerModule {}
