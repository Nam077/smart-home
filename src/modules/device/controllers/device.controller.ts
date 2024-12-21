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

import { PaginationDto } from '@app/common/dto/pagination.dto';
import { IPaginatedResponse } from '@app/common/interfaces/crud.interface';
import { CurrentUser } from '@app/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';
import { UpdateDeviceDto } from '@app/modules/device/dto/update-device.dto';
import { User } from '@app/modules/user/entities/user.entity';

import { CreateDeviceDto, CreateDeviceUserDto } from '../dto/create-device.dto';
import { Device } from '../entities/device.entity';
import { DeviceService } from '../services/device.service';

@ApiTags('Devices')
@Controller('devices')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a new device' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Device created successfully', type: Device })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async create(@Body() createDeviceDto: CreateDeviceDto): Promise<Device> {
        return this.deviceService.create(createDeviceDto);
    }

    @Post('user')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a new device' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Device created successfully', type: Device })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async createForUser(@Body() createDeviceDto: CreateDeviceUserDto, @CurrentUser() user: User): Promise<Device> {
        return this.deviceService.createForUser(createDeviceDto, user);
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all devices with pagination' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Devices retrieved successfully',
        type: () => Device,
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async findAll(@Query() query: PaginationDto): Promise<IPaginatedResponse<Device>> {
        return this.deviceService.findWithPagination(query);
    }

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get device by ID' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device retrieved successfully', type: Device })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Device> {
        return this.deviceService.findById(id);
    }

    @Get('room/:roomId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get devices by room id' })
    findByRoomId(@Param('roomId', ParseUUIDPipe) roomId: string) {
        return this.deviceService.findByRoomId(roomId);
    }

    @Get('controller/:controllerId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get devices by controller id' })
    findByControllerId(@Param('controllerId', ParseUUIDPipe) controllerId: string, @CurrentUser() user: User) {
        return this.deviceService.findByControllerId(controllerId, user);
    }

    @Get('controller/:controllerId/device')
    @ApiOperation({ summary: 'Get devices by controller id' })
    findDeviceByControllerId(@Param('controllerId', ParseUUIDPipe) controllerId: string) {
        return this.deviceService.findDeviceByControllerId(controllerId);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update device by ID' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device updated successfully', type: Device })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDeviceDto: UpdateDeviceDto): Promise<Device> {
        return this.deviceService.update(id, updateDeviceDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Soft delete device by ID' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.deviceService.softDelete(id);
    }

    @Delete(':id/hard')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Hard delete device by ID' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device permanently deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async hardDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.deviceService.hardDelete(id);
    }

    @Put(':id/restore')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Restore soft-deleted device' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device restored successfully', type: Device })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Device> {
        return this.deviceService.restore(id);
    }
}
