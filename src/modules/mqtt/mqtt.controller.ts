import { Controller, Post, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { MqttService } from './mqtt.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('MQTT')
@Controller('mqtt')
@UseGuards(JwtAuthGuard)
export class MqttController {
    constructor(private readonly mqttService: MqttService) {}

    @Post('device/:id/control')
    @ApiOperation({ summary: 'Send control command to device' })
    @ApiResponse({
        status: 200,
        description: 'Command sent successfully',
    })
    async controlDevice(@Param('id', ParseUUIDPipe) id: string, @Body() command: any) {
        await this.mqttService.publishControl(id, command);

        return { message: 'Command sent successfully' };
    }
}
