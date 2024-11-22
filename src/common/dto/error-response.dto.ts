import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from './base-response.dto';

export class ErrorResponseDto extends BaseResponseDto {
    static create(
        statusCode: number,
        message: string,
        errors?: Record<string, string[]>,
        stack?: string,
    ): ErrorResponseDto {
        return new ErrorResponseDto(statusCode, message, errors, stack);
    }

    static badRequest(message = 'Bad Request', errors?: Record<string, string[]>): ErrorResponseDto {
        return new ErrorResponseDto(400, message, errors);
    }

    static unauthorized(message = 'Unauthorized'): ErrorResponseDto {
        return new ErrorResponseDto(401, message);
    }

    static forbidden(message = 'Forbidden'): ErrorResponseDto {
        return new ErrorResponseDto(403, message);
    }

    static notFound(message = 'Not Found'): ErrorResponseDto {
        return new ErrorResponseDto(404, message);
    }

    static internalServerError(message = 'Internal Server Error', stack?: string): ErrorResponseDto {
        return new ErrorResponseDto(500, message, undefined, stack);
    }

    @ApiProperty({
        description: 'Error details',
        example: {
            field: ['error message'],
        },
        required: false,
    })
    errors?: Record<string, string[]>;

    @ApiProperty({
        description: 'Error stack trace (only in development)',
        example: 'Error: Something went wrong\n    at Function.create',
        required: false,
    })
    stack?: string;

    constructor(statusCode: number, message: string, errors?: Record<string, string[]>, stack?: string) {
        super(statusCode, message);

        if (errors) {
            this.errors = errors;
        }

        if (process.env.NODE_ENV !== 'production' && stack) {
            this.stack = stack;
        }
    }
}
