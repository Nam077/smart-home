import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { isEmpty } from 'lodash';
import { Repository } from 'typeorm';

import { CreateUserDto } from '@modules/user/dto/create-user.dto';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { User } from '@modules/user/entities/user.entity';
import { BaseCrudService } from '@services/base-crud.service';

@Injectable()
export class UserService extends BaseCrudService<User, CreateUserDto, UpdateUserDto> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(userRepository);
        this.hooks = {
            beforeCreate: async (data) => {
                const isExists = await this.exists({ username: data.username });

                if (isExists) {
                    throw new ConflictException(`User with username ${data.username} already exists`);
                }

                const isEmailExists = await this.exists({ email: data.email });

                if (isEmailExists) {
                    throw new ConflictException(`User with email ${data.email} already exists`);
                }

                const salt = await bcrypt.genSalt();

                data.password = await bcrypt.hash(data.password, salt);

                return data;
            },
            beforeUpdate: async (id, data) => {
                if (!isEmpty(data.password)) {
                    const salt = await bcrypt.genSalt();

                    data.password = await bcrypt.hash(data.password, salt);
                }

                return data;
            },
        };
    }

    protected get getEntityName(): string {
        return this.userRepository.metadata.name;
    }

    protected getSearchableFields(): string[] {
        return ['username', 'email', 'firstName', 'lastName'];
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.findOne({
            where: { username },
        });
    }

    async validatePassword(user: User, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.password);
    }
}
