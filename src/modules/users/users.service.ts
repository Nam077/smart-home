import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
    private readonly users = [];

    findAll() {
        return this.users;
    }
}
