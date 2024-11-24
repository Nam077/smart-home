import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { CommandTypeEnum } from '../types/mqtt.types';

export class DeviceControlBaseDto {
    @IsUUID()
    deviceId: string;

    @IsUUID()
    roomId: string;

    @IsEnum(CommandTypeEnum)
    command: CommandTypeEnum;
}

export class DeviceStatusControlDto extends DeviceControlBaseDto {
    @IsBoolean()
    value: boolean;
}

export class DeviceValueControlDto extends DeviceControlBaseDto {
    @IsNumber()
    value: number;

    @IsString()
    @IsOptional()
    unit?: string;
}

export class DeviceBrightnessControlDto extends DeviceControlBaseDto {
    @IsNumber()
    value: number;
}

export class DeviceTemperatureControlDto extends DeviceControlBaseDto {
    @IsNumber()
    value: number;
}

export class DeviceSpeedControlDto extends DeviceControlBaseDto {
    @IsNumber()
    value: number;
}

export class DeviceConfigDto {
    @IsNumber()
    @IsOptional()
    updateInterval?: number;

    @IsNumber()
    @IsOptional()
    threshold?: number;
}

export class DeviceConfigControlDto extends DeviceControlBaseDto {
    @ValidateNested()
    @Type(() => DeviceConfigDto)
    value: DeviceConfigDto;
}

// DTO for broadcast commands
export class RoomBroadcastControlDto {
    @IsUUID()
    roomId: string;

    @IsEnum(CommandTypeEnum)
    command: CommandTypeEnum;
}

// DTO for device query
export class DeviceQueryDto extends DeviceControlBaseDto {
    @IsString()
    @IsOptional()
    type?: string;
}

// Response DTOs
export class DeviceStatusResponseDto {
    @IsBoolean()
    status: boolean;

    @IsNumber()
    @IsOptional()
    value?: number;

    @IsNumber()
    @IsOptional()
    brightness?: number;

    @IsNumber()
    @IsOptional()
    temperature?: number;

    @IsNumber()
    @IsOptional()
    humidity?: number;

    @IsNumber()
    @IsOptional()
    speed?: number;

    @IsBoolean()
    isOnline: boolean;

    @IsBoolean()
    isConnected: boolean;
}
