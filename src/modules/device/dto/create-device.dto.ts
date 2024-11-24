import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsIP, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

import { DeviceFunctionEnum, DeviceTypeEnum } from '../entities/device.entity';

export class CreateDeviceDto {
    @ApiProperty({
        description: 'Device name',
        example: 'Living Room Light',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Device type',
        enum: DeviceTypeEnum,
        example: DeviceTypeEnum.ACTUATOR,
        default: DeviceTypeEnum.ACTUATOR,
    })
    @IsEnum(DeviceTypeEnum)
    type: DeviceTypeEnum;

    @ApiProperty({
        description: 'Device function',
        enum: DeviceFunctionEnum,
        example: DeviceFunctionEnum.RELAY,
        default: DeviceFunctionEnum.RELAY,
    })
    @IsEnum(DeviceFunctionEnum)
    function: DeviceFunctionEnum;

    @ApiProperty({
        description: 'Control pin (GPIO)',
        example: 'GPIO18',
        required: false,
    })
    @IsString()
    @IsOptional()
    controlPin?: string;

    @ApiProperty({
        description: 'Device status',
        example: false,
        default: false,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    status?: boolean;

    @ApiProperty({
        description: 'Device value (for sensors)',
        example: 25.5,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    value?: number;

    @ApiProperty({
        description: 'Device unit (for sensors)',
        example: '°C',
        required: false,
    })
    @IsString()
    @IsOptional()
    unit?: string;

    @ApiProperty({
        description: 'Device description',
        example: 'Main light in living room',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Device location',
        example: 'Living Room Corner',
        required: false,
    })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiProperty({
        description: 'Device brightness (0-100)',
        example: 50,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    brightness?: number;

    @ApiProperty({
        description: 'Device manufacturer',
        example: 'Sonoff',
        required: false,
    })
    @IsString()
    @IsOptional()
    manufacturer?: string;

    @ApiProperty({
        description: 'Device model',
        example: 'Basic R2',
        required: false,
    })
    @IsString()
    @IsOptional()
    model?: string;

    @ApiProperty({
        description: 'Device serial number',
        example: 'SN123456789',
        required: false,
    })
    @IsString()
    @IsOptional()
    serialNumber?: string;

    @ApiProperty({
        description: 'Room ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    roomId: string;

    @ApiProperty({
        description: 'Controller ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    controllerId?: string;

    @ApiProperty({
        description: 'User ID who owns this device',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    userId: string;

    @ApiProperty({
        description: 'Device IP address',
        example: '192.168.1.100',
        required: false,
    })
    @IsIP()
    @IsOptional()
    ipAddress?: string;

    @ApiProperty({
        description: 'Device port',
        example: 8080,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    port?: number;

    @ApiProperty({
        description: 'Device MAC address',
        example: '00:1B:44:11:3A:B7',
        required: false,
    })
    @IsString()
    @IsOptional()
    macAddress?: string;

    @ApiProperty({
        description: 'Device firmware version',
        example: '1.0.0',
        required: false,
    })
    @IsString()
    @IsOptional()
    firmwareVersion?: string;

    @ApiProperty({
        description: 'Device image URL',
        example: 'https://example.com/device.jpg',
        required: false,
    })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiProperty({
        description: 'Device online status',
        example: false,
        default: false,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isOnline?: boolean;
}
