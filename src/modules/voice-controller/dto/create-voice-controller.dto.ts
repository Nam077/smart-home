import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { trim } from 'lodash';

export class CreateVoiceControllerDto {
    @ApiProperty({ description: 'The text to be processed by the voice controller' })
    @Transform(({ value }) => trim(value))
    @IsString()
    @IsNotEmpty()
    text: string;

    @ApiProperty({ description: 'The unique identifier for the voice controller' })
    @IsUUID()
    @IsNotEmpty()
    controllerId: string;
}
