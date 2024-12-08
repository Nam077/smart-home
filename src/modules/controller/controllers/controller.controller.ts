import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IBaseOptions } from '@app/common/interfaces/crud.interface';

import { CreateControllerDto, CreateControllerForUserDto } from '../dto/create-controller.dto';
import { UpdateControllerDto } from '../dto/update-controller.dto';
import { ControllerService } from '../services/controller.service';
import { CurrentUser } from '@app/modules/auth/decorators/current-user.decorator';
import { User } from '@app/modules/user/entities/user.entity';
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';

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
    @Post('user')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a new controller' })
    createForUser(@Body() createControllerDto: CreateControllerForUserDto, @CurrentUser() user: User) {
        return this.controllerService.createForUser(createControllerDto, user);
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
