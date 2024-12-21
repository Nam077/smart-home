import { PartialType } from '@nestjs/swagger';
import { CreateVoiceControllerDto } from './create-voice-controller.dto';

export class UpdateVoiceControllerDto extends PartialType(CreateVoiceControllerDto) {}
