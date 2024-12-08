import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsIP, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateControllerDto {
    @ApiProperty({
        description: 'Controller name',
        example: 'Living Room Controller',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Controller description',
        example: 'Controls lights and sensors in living room',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Controller IP address',
        example: '192.168.1.100',
        required: false,
    })
    @IsIP()
    @IsOptional()
    ipAddress?: string;

    @ApiProperty({
        description: 'Controller MAC address',
        example: '00:1B:44:11:3A:B7',
        required: false,
    })
    @IsString()
    @IsOptional()
    macAddress?: string;

    @ApiProperty({
        description: 'Controller firmware version',
        example: '1.0.0',
        required: false,
    })
    @IsString()
    @IsOptional()
    firmwareVersion?: string;

    @ApiProperty({
        description: 'User ID who owns this controller',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    userId: string;
}

export class CreateControllerForUserDto extends OmitType(CreateControllerDto, ['userId']) {}