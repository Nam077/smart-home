import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';
import { CurrentUser } from '@app/modules/auth/decorators/current-user.decorator';
import { User } from '@app/modules/user/entities/user.entity';
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';
import { RefreshTokenGuard } from '@app/modules/auth/guards/refresh-token.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    @UseGuards(RefreshTokenGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Token refreshed successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid refresh token' })
    async refreshTokens(@CurrentUser() user: any) {
        return this.authService.refreshTokens(user.id, user.refreshToken);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Profile retrieved successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid token' })
    async me(@CurrentUser() user: User) {
        return this.authService.me(user);
    }
}
