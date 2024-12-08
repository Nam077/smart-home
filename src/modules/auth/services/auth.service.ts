import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '@modules/user/entities/user.entity';
import { UserService } from '@modules/user/services/user.service';

import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    async me(user: User): Promise<User> {
        console.log(user);
        
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

        console.log(user);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { email: user.email, sub: user.id };

        return {
            accessToken: this.jwtService.sign(payload),
            user,
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
