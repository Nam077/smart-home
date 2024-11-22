import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'The email address of the user',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'johndoe',
        description: 'The username of the user',
        minLength: 3,
    })
    @IsNotEmpty()
    @MinLength(3)
    username: string;

    @ApiProperty({
        example: 'password123',
        description: 'The password for the user account',
        minLength: 8,
    })
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiProperty({
        example: 'John',
        description: 'The first name of the user',
        required: false,
    })
    @IsOptional()
    firstName?: string;

    @ApiProperty({
        example: 'Doe',
        description: 'The last name of the user',
        required: false,
    })
    @IsOptional()
    lastName?: string;
}
