import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BaseResponseDto {
    @ApiProperty({
        description: 'HTTP Status code',
        example: 200,
    })
    @Expose()
    statusCode: number;

    @ApiProperty({
        description: 'Response message',
        example: 'Success',
    })
    @Expose()
    message: string;

    @ApiProperty({
        description: 'Timestamp of the response',
        example: '2024-01-20T12:34:56.789Z',
    })
    @Expose()
    timestamp: string;

    @ApiProperty({
        description: 'Path of the request',
        example: '/users',
    })
    @Expose()
    path: string;

    constructor(statusCode: number, message: string) {
        this.statusCode = statusCode;
        this.message = message;
        this.timestamp = new Date().toISOString();
    }
}
