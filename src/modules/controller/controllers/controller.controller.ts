import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { IBaseOptions } from '@app/common/interfaces/crud.interface';

import { CreateControllerDto } from '../dto/create-controller.dto';
import { UpdateControllerDto } from '../dto/update-controller.dto';
import { ControllerService } from '../services/controller.service';

@ApiTags('controllers')
// @UseGuards(JwtAuthGuard)
@Controller('controllers')
export class ControllerController {
    constructor(private readonly controllerService: ControllerService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new controller' })
    create(@Body() createControllerDto: CreateControllerDto) {
        return this.controllerService.create(createControllerDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all controllers' })
    findAll(@Query() options?: IBaseOptions) {
        return this.controllerService.findAll(options);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get controller by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.controllerService.findById(id);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get controllers by user id' })
    findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.controllerService.findByUserId(userId);
    }

    @Get('device/:deviceId')
    @ApiOperation({ summary: 'Get controller by device id' })
    findByDeviceId(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
        return this.controllerService.findByDeviceId(deviceId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update controller by id' })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateControllerDto: UpdateControllerDto) {
        return this.controllerService.update(id, updateControllerDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete controller by id' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.controllerService.softDelete(id);
    }
}
