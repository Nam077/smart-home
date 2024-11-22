import { BaseResponseDto } from './base-response.dto';

export class SuccessResponseDto<T> extends BaseResponseDto {
    static create<T>(data: T, message?: string): SuccessResponseDto<T> {
        return new SuccessResponseDto(data, message);
    }

    constructor(data: T, message = 'Success') {
        super(200, message);
    }
}
