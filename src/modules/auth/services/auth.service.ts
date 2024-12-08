import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { User } from '@modules/user/entities/user.entity';
import { UserService } from '@modules/user/services/user.service';

import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async me(user: User): Promise<User> {
        if (!user) {
            throw new UnauthorizedException();
        }
        return this.userService.findById(user.id);
    }
    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userService.findOne({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                firstName: true,
                lastName: true
            }
        });

        console.log(user);

        if (user && (await user.validatePassword(password))) {
            delete user.password;

            return user;
        }

        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.getTokens(user.id, user.email);

        return {
            ...tokens,
            user,
        };
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('Access Denied');
        }

        const tokens = await this.getTokens(user.id, user.email);
        return tokens;
    }

    private async getTokens(userId: string, email: string) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                },
                {
                    secret: this.configService.get<string>('jwt.secret'),
                    expiresIn: this.configService.get<string>('jwt.expiresIn'),
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                },
                {
                    secret: this.configService.get<string>('jwt.refreshSecret'),
                    expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
                },
            ),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    async verifyToken(token: string): Promise<User> {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            const user = await this.userService.findOne(payload.sub);

            if (!user) {
                throw new UnauthorizedException();
            }

            return user;
        } catch {
            throw new UnauthorizedException();
        }
    }
}
