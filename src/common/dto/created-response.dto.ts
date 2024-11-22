import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from './base-response.dto';

export class CreatedResponseDto<T> extends BaseResponseDto {
    static create<T>(data: T, message?: string): CreatedResponseDto<T> {
        return new CreatedResponseDto(data, message);
    }

    @ApiProperty({
        description: 'Response data',
        type: 'object',
        additionalProperties: true,
        isArray: false,
    })
    data: T;

    constructor(data: T, message = 'Resource created successfully') {
        super(201, message);
        this.data = data;
    }
}
