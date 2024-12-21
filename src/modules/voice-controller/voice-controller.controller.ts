import { Body, Controller, Post } from '@nestjs/common';

import { CreateVoiceControllerDto } from '@app/modules/voice-controller/dto/create-voice-controller.dto';

import { VoiceControllerService } from './voice-controller.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Voice Controller')
@Controller('voice-controller')
export class VoiceControllerController {
    constructor(private readonly voiceControllerService: VoiceControllerService) {}

    @Post()
    handler(@Body() ceateVoiceControllerDto: CreateVoiceControllerDto) {
        return this.voiceControllerService.handler(ceateVoiceControllerDto);
    }
}
