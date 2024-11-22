import { BaseResponseDto } from './base-response.dto';

export class NoContentResponseDto extends BaseResponseDto {
    constructor(message = 'No Content') {
        super(204, message);
    }

    static create(message?: string): NoContentResponseDto {
        return new NoContentResponseDto(message);
    }
}
