import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    ValidationPipe,
    Put,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiProperty,
    ApiBearerAuth,
    ApiBasicAuth,
} from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BaseResponseDto } from '@app/common/dto/base-response.dto';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import type { IPaginatedResponse } from '@interfaces/crud.interface';
import { CreateUserDto } from '@modules/user/dto/create-user.dto';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { User } from '@modules/user/entities/user.entity';
import { UserService } from '@modules/user/services/user.service';

class UserRespone {
    @ApiProperty({
        name: 'id',
        description: 'The ID of the user',
        type: String,
        format: 'uuid',
        example: '9a9a9a9a-9a9a-9a9a-9a9a-9a9a9a9a9a9a',
    })
    @Expose()
    id: string;

    @ApiProperty({
        name: 'email',
        description: 'The email address of the user',
        type: String,
        example: 'user@example',
    })
    @Expose()
    email: string;

    @ApiProperty({
        name: 'username',
        description: 'The username of the user',
        type: String,
        example: 'johndoe',
    })
    @Expose()
    username: string;

    @ApiProperty({
        name: 'firstName',
        description: 'The first name of the user',
        type: String,
        example: 'John',
    })
    @Expose()
    firstName: string;

    @ApiProperty({
        name: 'lastName',
        description: 'The last name of the user',
        type: String,
        example: 'Doe',
    })
    @Expose()
    lastName: string;
}

class CreateUserResponseDto extends BaseResponseDto {
    @ApiProperty({ type: UserRespone })
    @Expose()
    @Type(() => UserRespone)
    data: UserRespone;
}

@ApiTags('Users')
@ApiTags('Admin')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    @ApiBearerAuth()
    @ApiBasicAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User created successfully',
        type: CreateUserResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async create(
        @Body(ValidationPipe) createUserDto: CreateUserDto,
        // @Ctx() context: ICsalContext, // Add when auth is implemented
    ): Promise<User> {
        return this.userService.create(createUserDto);
    }

    @Post('bulk')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create multiple users' })
    @ApiBody({ type: [CreateUserDto] })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Users created successfully', type: [User] })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async createMany(
        @Body(ValidationPipe) createUserDtos: CreateUserDto[],
        // @Ctx() context: ICsalContext, // Add when auth is implemented
    ): Promise<User[]> {
        return this.userService.createMany(createUserDtos);
    }

    @Get()
    @ApiOperation({ summary: 'Get all users with pagination' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Users retrieved successfully',
        type: () => PaginatedResponseDto<User>,
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async findAll(@Query() query: PaginationDto): Promise<IPaginatedResponse<User>> {
        return this.userService.findWithPagination(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiParam({ name: 'id', description: 'User ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully', type: User })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
        return this.userService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update user by ID' })
    @ApiParam({ name: 'id', description: 'User ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully', type: User })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) updateUserDto: UpdateUserDto,
        // @Ctx() context: ICsalContext, // Add when auth is implemented
    ): Promise<User> {
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete user by ID' })
    @ApiParam({ name: 'id', description: 'User ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        // @Ctx() context: ICsalContext, // Add when auth is implemented
    ): Promise<void> {
        await this.userService.softDelete(id);
    }

    @Delete(':id/hard')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Hard delete user by ID' })
    @ApiParam({ name: 'id', description: 'User ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User permanently deleted' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async hardRemove(
        @Param('id', ParseUUIDPipe) id: string,
        // @Ctx() context: ICsalContext, // Add when auth is implemented
    ): Promise<void> {
        await this.userService.hardDelete(id);
    }

    @Put(':id/restore')
    @ApiOperation({ summary: 'Restore soft-deleted user' })
    @ApiParam({ name: 'id', description: 'User ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'User restored successfully', type: User })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async restore(
        @Param('id', ParseUUIDPipe) id: string,
        // @Ctx() context: ICsalContext, // Add when auth is implemented
    ): Promise<User> {
        return this.userService.restore(id);
    }
}
