import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
    constructor(private dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.findOne({ where: { email } });
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.findOne({ where: { username } });
    }

    async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
        return this.createQueryBuilder('user')
            .where('user.email = :emailOrUsername OR user.username = :emailOrUsername', {
                emailOrUsername,
            })
            .getOne();
    }
}
