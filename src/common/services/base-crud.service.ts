/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable brace-style */
/* eslint-disable lodash/prefer-lodash-method */
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { Repository, DeepPartial, FindOptionsWhere, QueryRunner } from 'typeorm';
import type { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import type { PaginationDto } from '@app/common/dto/pagination.dto';
import type {
    IBaseEntity,
    ICrudService,
    IQueryOptions,
    IFindOneOptions,
    ICsalContext,
    ICrudHooks,
    IPaginatedResponse,
    IBaseOptions,
} from '@interfaces/crud.interface';

export abstract class BaseCrudService<T extends IBaseEntity, CreateDTO = DeepPartial<T>, UpdateDTO = DeepPartial<T>>
    implements ICrudService<T, CreateDTO, UpdateDTO>
{
    protected hooks?: ICrudHooks<T, CreateDTO, UpdateDTO>;

    constructor(
        protected readonly repository: Repository<T>,
        hooks?: ICrudHooks<T, CreateDTO, UpdateDTO>,
    ) {
        this.hooks = hooks;
    }

    protected abstract get getEntityName(): string;

    protected async checkCreatePermission(
        data: CreateDTO,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<void> {
        if (options?.skipPermissionCheck) return;
        // Override this method in derived classes
    }

    protected async checkReadPermission(
        entity: T | null,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<void> {
        if (options?.skipPermissionCheck) return;
        // Override this method in derived classes
    }

    protected async checkUpdatePermission(
        entity: T,
        data: UpdateDTO,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<void> {
        if (options?.skipPermissionCheck) return;
        // Override this method in derived classes
    }

    protected async checkDeletePermission(entity: T, context?: ICsalContext, options?: IBaseOptions): Promise<void> {
        if (options?.skipPermissionCheck) return;
        // Override this method in derived classes
    }

    protected async checkRestorePermission(entity: T, context?: ICsalContext, options?: IBaseOptions): Promise<void> {
        if (options?.skipPermissionCheck) return;
        // Override this method in derived classes
    }

    protected async transaction<R>(
        operation: (queryRunner: QueryRunner) => Promise<R>,
        options: { isolation?: IsolationLevel } = {},
    ): Promise<R> {
        const queryRunner = this.repository.manager.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction(options.isolation);

        try {
            const result = await operation(queryRunner);

            await queryRunner.commitTransaction();

            return result;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async create(dto: CreateDTO, context?: ICsalContext, options?: IBaseOptions): Promise<T> {
        await this.checkCreatePermission(dto, context, options);

        return this.transaction(async (queryRunner) => {
            const processedDto = this.hooks?.beforeCreate ? await this.hooks.beforeCreate(dto, context) : dto;

            const entity = this.repository.create(processedDto as DeepPartial<T>);
            const savedEntity = await queryRunner.manager.save(entity);

            return this.hooks?.afterCreate ? await this.hooks.afterCreate(savedEntity, context) : savedEntity;
        });
    }

    async createMany(dtos: CreateDTO[], context?: ICsalContext, options?: IBaseOptions): Promise<T[]> {
        await Promise.all(dtos.map((dto) => this.checkCreatePermission(dto, context, options)));

        return this.transaction(async (queryRunner) => {
            const processedDtos = await Promise.all(
                dtos.map(async (dto) => {
                    return this.hooks?.beforeCreate ? await this.hooks.beforeCreate(dto, context) : dto;
                }),
            );

            const entities = this.repository.create(processedDtos as DeepPartial<T>[]);
            const savedEntities = await queryRunner.manager.save(entities);

            if (this.hooks?.afterCreate) {
                const afterCreateHook = this.hooks.afterCreate;

                return Promise.all(savedEntities.map((entity) => afterCreateHook(entity, context)));
            }

            return savedEntities;
        });
    }

    async findAll(options?: IQueryOptions<T>, context?: ICsalContext): Promise<T[]> {
        const { page, limit, search, ...findOptions } = options || {};
        const entities = await this.repository.find(findOptions);

        await Promise.all(entities.map((entity) => this.checkReadPermission(entity, context, options)));

        return entities;
    }

    async findWithPagination(paginationDto: PaginationDto, context?: ICsalContext): Promise<IPaginatedResponse<T>> {
        const { page, limit, sortBy, order, select, relations, search, filter } = paginationDto;

        const queryBuilder = this.repository.createQueryBuilder('entity');

        // Apply search if provided
        if (search) {
            const searchableFields = this.getSearchableFields();

            if (searchableFields.length > 0) {
                queryBuilder.where(
                    searchableFields.map((field) => `LOWER(entity.${field}) LIKE LOWER(:search)`).join(' OR '),
                    { search: `%${search}%` },
                );
            }
        }

        // Apply filter if provided
        if (filter) {
            const parsedFilter = typeof filter === 'string' ? JSON.parse(filter) : filter;

            Object.entries(parsedFilter).forEach(([key, value]) => {
                queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
            });
        }

        // Apply select if provided
        if (select) {
            const fields = typeof select === 'string' ? select.split(',') : select;

            queryBuilder.select(['entity.id', ...fields.map((field) => `entity.${field}`)]);
        }

        // Apply relations if provided
        if (relations) {
            const relationFields = typeof relations === 'string' ? relations.split(',') : relations;

            relationFields.forEach((relation) => {
                queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
            });
        }

        // Apply sorting
        queryBuilder.orderBy(`entity.${sortBy || 'createdAt'}`, order || 'DESC');

        // Apply pagination
        const take = limit || 10;
        const skip = ((page || 1) - 1) * take;

        queryBuilder.skip(skip).take(take);

        try {
            // Get paginated results
            const [items, total] = await queryBuilder.getManyAndCount();

            // Return paginated response
            return {
                items,
                total,
                page: page || 1,
                limit: take,
                totalPages: Math.ceil(total / take),
                hasNext: (page || 1) * take < total,
                hasPrevious: (page || 1) > 1,
            };
        } catch (error) {
            console.log(error);

            throw new InternalServerErrorException('Error retrieving paginated results');
        }
    }

    protected getSearchableFields(): string[] {
        // This method should be overridden by child classes to specify which fields are searchable
        return [];
    }

    async findById(id: string, options?: IFindOneOptions<T>, context?: ICsalContext): Promise<T> {
        const entity = await this.repository.findOne({
            ...options,
            where: { id } as FindOptionsWhere<T>,
        });

        if (!entity) {
            throw new NotFoundException(`${this.getEntityName} with id ${id} not found`);
        }

        await this.checkReadPermission(entity, context, options);

        return entity;
    }

    async findOne(options: IFindOneOptions<T>, context?: ICsalContext): Promise<T> {
        const entity = await this.repository.findOne(options);

        if (!entity) {
            throw new NotFoundException(`${this.getEntityName} not found`);
        }

        await this.checkReadPermission(entity, context, options);

        return entity;
    }

    async update(id: string, dto: UpdateDTO, context?: ICsalContext, options?: IBaseOptions): Promise<T> {
        const entity = await this.findById(id, undefined, context);

        await this.checkUpdatePermission(entity, dto, context, options);

        return this.transaction(async (queryRunner) => {
            const processedDto = this.hooks?.beforeUpdate ? await this.hooks.beforeUpdate(id, dto, context) : dto;

            const updatedEntity = await queryRunner.manager.save({
                ...entity,
                ...processedDto,
            });

            return this.hooks?.afterUpdate ? await this.hooks.afterUpdate(updatedEntity, context) : updatedEntity;
        });
    }

    async updateMany(
        criteria: FindOptionsWhere<T>,
        dto: QueryDeepPartialEntity<T>,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<number> {
        const entities = await this.findAll({ where: criteria }, context);

        await Promise.all(
            entities.map((entity) => this.checkUpdatePermission(entity, dto as UpdateDTO, context, options)),
        );

        return this.transaction(async (queryRunner) => {
            const result = await queryRunner.manager.update(this.repository.target, criteria, dto);

            return result.affected || 0;
        });
    }

    async exists(criteria: FindOptionsWhere<T>, context?: ICsalContext): Promise<boolean> {
        return this.repository.exist({ where: criteria });
    }

    async count(criteria: FindOptionsWhere<T>, context?: ICsalContext): Promise<number> {
        return this.repository.count({ where: criteria });
    }

    async softDelete(id: string, context?: ICsalContext, options?: IBaseOptions): Promise<boolean> {
        const entity = await this.findById(id, undefined, context);

        await this.checkDeletePermission(entity, context, options);

        return this.transaction(async (queryRunner) => {
            if (this.hooks?.beforeDelete) {
                await this.hooks.beforeDelete(id, context);
            }

            const result = await queryRunner.manager.softDelete(this.repository.target, id);

            const isSuccess = !!result.affected;

            if (isSuccess && this.hooks?.afterDelete) {
                await this.hooks.afterDelete(id, context);
            }

            return isSuccess;
        });
    }

    async softDeleteMany(
        criteria: FindOptionsWhere<T>,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<number> {
        const entities = await this.findAll({ where: criteria }, context);

        await Promise.all(entities.map((entity) => this.checkDeletePermission(entity, context, options)));

        return this.transaction(async (queryRunner) => {
            const result = await queryRunner.manager.softDelete(this.repository.target, criteria);

            return result.affected || 0;
        });
    }

    async hardDelete(id: string, context?: ICsalContext, options?: IBaseOptions): Promise<boolean> {
        const entity = await this.findById(id, { withDeleted: true }, context);

        await this.checkDeletePermission(entity, context, options);

        return this.transaction(async (queryRunner) => {
            if (this.hooks?.beforeDelete) {
                await this.hooks.beforeDelete(id, context);
            }

            const result = await queryRunner.manager.delete(this.repository.target, id);

            const isSuccess = !!result.affected;

            if (isSuccess && this.hooks?.afterDelete) {
                await this.hooks.afterDelete(id, context);
            }

            return isSuccess;
        });
    }

    async hardDeleteMany(
        criteria: FindOptionsWhere<T>,
        context?: ICsalContext,
        options?: IBaseOptions,
    ): Promise<number> {
        const entities = await this.findAll({ where: criteria, withDeleted: true }, context);

        await Promise.all(entities.map((entity) => this.checkDeletePermission(entity, context, options)));

        return this.transaction(async (queryRunner) => {
            const result = await queryRunner.manager.delete(this.repository.target, criteria);

            return result.affected || 0;
        });
    }

    async restore(id: string, context?: ICsalContext, options?: IBaseOptions): Promise<T> {
        const entity = await this.findById(id, { withDeleted: true }, context);

        await this.checkRestorePermission(entity, context, options);

        await this.repository.restore(id);

        return this.findById(id, undefined, context);
    }

    async restoreMany(criteria: FindOptionsWhere<T>, context?: ICsalContext, options?: IBaseOptions): Promise<number> {
        const entities = await this.findAll({ where: criteria, withDeleted: true }, context);

        await Promise.all(entities.map((entity) => this.checkRestorePermission(entity, context, options)));

        const result = await this.repository.restore(criteria);

        return result.affected || 0;
    }
}
