import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export enum DeviceControlTypeEnum {
    SET_STATUS = 'set_status',
    SET_VALUE = 'set_value',
    SET_BRIGHTNESS = 'set_brightness',
    SET_TEMPERATURE = 'set_temperature',
    GET_INFO = 'get_info',
}

export class DeviceControlDto {
    @IsEnum(DeviceControlTypeEnum)
    type: DeviceControlTypeEnum;

    @IsNumber()
    @IsOptional()
    value?: number;
}
