import type { DeepPartial, FindOptionsWhere, FindManyOptions, FindOneOptions } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import type { PaginationDto } from '@common/dto/pagination.dto';

export interface IBaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface IBaseOptions {
    skipPermissionCheck?: boolean;
}

export interface IQueryOptions<T> extends Omit<FindManyOptions<T>, 'where'>, IBaseOptions {
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    page?: number;
    limit?: number;
    search?: string;
}

export interface IFindOneOptions<T> extends Omit<FindOneOptions<T>, 'where'>, IBaseOptions {
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
}

export interface IPaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface ICsalContext {
    userId?: string;
    organizationId?: string;
    roles?: string[];
    permissions?: string[];
    tenantId?: string;
    metadata?: Record<string, unknown>;
}

export interface ICrudHooks<T extends IBaseEntity, CreateDTO = DeepPartial<T>, UpdateDTO = DeepPartial<T>> {
    beforeCreate?: (dto: CreateDTO, context?: ICsalContext) => Promise<CreateDTO>;
    afterCreate?: (entity: T, context?: ICsalContext) => Promise<T>;
    beforeUpdate?: (id: string, dto: UpdateDTO, context?: ICsalContext) => Promise<UpdateDTO>;
    afterUpdate?: (entity: T, context?: ICsalContext) => Promise<T>;
    beforeDelete?: (id: string, context?: ICsalContext) => Promise<void>;
    afterDelete?: (id: string, context?: ICsalContext) => Promise<void>;
}

export interface ICrudService<T extends IBaseEntity, CreateDTO = DeepPartial<T>, UpdateDTO = DeepPartial<T>> {
    create: (dto: CreateDTO, context?: ICsalContext, options?: IBaseOptions) => Promise<T>;
    createMany: (dtos: CreateDTO[], context?: ICsalContext, options?: IBaseOptions) => Promise<T[]>;

    find: (options?: IQueryOptions<T>, context?: ICsalContext) => Promise<T[]>;
    findWithPagination: (paginationDto: PaginationDto, context?: ICsalContext) => Promise<IPaginatedResponse<T>>;
    findById: (id: string, options?: IFindOneOptions<T>, context?: ICsalContext) => Promise<T>;
    findOne: (options: IFindOneOptions<T>, context?: ICsalContext) => Promise<T>;

    update: (id: string, dto: UpdateDTO, context?: ICsalContext, options?: IBaseOptions) => Promise<T>;
    updateMany: (
        criteria: FindOptionsWhere<T>,
        dto: QueryDeepPartialEntity<T>,
        context?: ICsalContext,
        options?: IBaseOptions,
    ) => Promise<number>;

    exists: (criteria: FindOptionsWhere<T>, context?: ICsalContext) => Promise<boolean>;
    count: (criteria: FindOptionsWhere<T>, context?: ICsalContext) => Promise<number>;

    softDelete: (id: string, context?: ICsalContext, options?: IBaseOptions) => Promise<boolean>;
    softDeleteMany: (criteria: FindOptionsWhere<T>, context?: ICsalContext, options?: IBaseOptions) => Promise<number>;

    hardDelete: (id: string, context?: ICsalContext, options?: IBaseOptions) => Promise<boolean>;
    hardDeleteMany: (criteria: FindOptionsWhere<T>, context?: ICsalContext, options?: IBaseOptions) => Promise<number>;

    restore: (id: string, context?: ICsalContext, options?: IBaseOptions) => Promise<T>;
    restoreMany: (criteria: FindOptionsWhere<T>, context?: ICsalContext, options?: IBaseOptions) => Promise<number>;
}
