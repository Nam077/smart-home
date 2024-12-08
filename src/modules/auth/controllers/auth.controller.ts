import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';
import { CurrentUser } from '@app/modules/auth/decorators/current-user.decorator';
import { User } from '@app/modules/user/entities/user.entity';
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User logged in successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid credentials',
    })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get current user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized',
    })
    async me(@CurrentUser() user: User) {
        return this.authService.me(user);
    }
}
