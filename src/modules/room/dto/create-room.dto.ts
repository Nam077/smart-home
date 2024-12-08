import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoomDto {
    @ApiProperty({
        description: 'Room name',
        example: 'Living Room',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Room description',
        example: 'Main living room on first floor',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Floor number',
        example: 1,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    floor?: number;

    @ApiProperty({
        description: 'Room area in square meters',
        example: 30.5,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    area?: number;

    @ApiProperty({
        description: 'Room image URL',
        example: 'https://example.com/room.jpg',
        required: false,
    })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiProperty({
        description: 'User ID who owns this room',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    userId: string;
}


export class CreateRoomUserDto extends OmitType (CreateRoomDto, ['userId']) {}
  