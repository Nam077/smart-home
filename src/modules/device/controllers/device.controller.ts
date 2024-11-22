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
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PaginationDto } from '@app/common/dto/pagination.dto';
import { IPaginatedResponse } from '@app/common/interfaces/crud.interface';

import { CreateDeviceDto } from '../dto/create-device.dto';
import { Device } from '../entities/device.entity';
import { DeviceService } from '../services/device.service';

@Controller('devices')
@ApiTags('Devices')
// @UseGuards(JwtAuthGuard)
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new device' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Device created successfully', type: Device })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async create(@Body() createDeviceDto: CreateDeviceDto): Promise<Device> {
        return this.deviceService.create(createDeviceDto);
    }

    @Get()
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
    @ApiOperation({ summary: 'Get device by ID' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device retrieved successfully', type: Device })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Device> {
        return this.deviceService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update device by ID' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device updated successfully', type: Device })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDeviceDto: Partial<CreateDeviceDto>,
    ): Promise<Device> {
        return this.deviceService.update(id, updateDeviceDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete device by ID' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.deviceService.softDelete(id);
    }

    @Delete(':id/hard')
    @ApiOperation({ summary: 'Hard delete device by ID' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device permanently deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async hardDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.deviceService.hardDelete(id);
    }

    @Put(':id/restore')
    @ApiOperation({ summary: 'Restore soft-deleted device' })
    @ApiParam({ name: 'id', description: 'Device ID', type: String, format: 'uuid' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Device restored successfully', type: Device })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission denied' })
    async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Device> {
        return this.deviceService.restore(id);
    }
}
