import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PaginatedResponseDto } from '@app/common/dto/paginated-response.dto';
import { PaginationDto } from '@app/common/dto/pagination.dto';
import { IPaginatedResponse } from '@app/common/interfaces/crud.interface';

import { CreateRoomDto, CreateRoomUserDto } from '../dto/create-room.dto';
import { Room } from '../entities/room.entity';
import { RoomService } from '../services/room.service';
import { CurrentUser } from '@app/modules/auth/decorators/current-user.decorator';
import { User } from '@app/modules/user/entities/user.entity';
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';

@Controller('rooms')
@ApiTags('Rooms')
// @UseGuards(JwtAuthGuard)
export class RoomController {
    constructor(private readonly roomService: RoomService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new room' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Room created successfully', type: Room })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async create(@Body() createRoomDto: CreateRoomDto): Promise<Room> {
        return this.roomService.create(createRoomDto);
    }


    @Post('user')
    @ApiOperation({ summary: 'Create a new room for user' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Room created successfully', type: Room })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async createForUser(@Body() createRoomDto: CreateRoomUserDto, @CurrentUser() user: User): Promise<Room> {
        return this.roomService.createForUser(createRoomDto, user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all rooms with pagination' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Rooms retrieved successfully',
        type: () => PaginatedResponseDto<Room>,
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async findAll(@Query() query: PaginationDto): Promise<IPaginatedResponse<Room>> {
        return this.roomService.findWithPagination(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get room by ID' })
    @ApiParam({ name: 'id', description: 'Room ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Room retrieved successfully', type: Room })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Room> {
        return this.roomService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update room by ID' })
    @ApiParam({ name: 'id', description: 'Room ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Room updated successfully', type: Room })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateRoomDto: Partial<CreateRoomDto>): Promise<Room> {
        return this.roomService.update(id, updateRoomDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete room by ID' })
    @ApiParam({ name: 'id', description: 'Room ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Room deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.roomService.softDelete(id);
    }

    @Delete(':id/hard')
    @ApiOperation({ summary: 'Hard delete room by ID' })
    @ApiParam({ name: 'id', description: 'Room ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Room permanently deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async hardDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.roomService.hardDelete(id);
    }

    @Put(':id/restore')
    @ApiOperation({ summary: 'Restore soft-deleted room' })
    @ApiParam({ name: 'id', description: 'Room ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Room restored successfully', type: Room })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Room> {
        return this.roomService.restore(id);
    }
}
