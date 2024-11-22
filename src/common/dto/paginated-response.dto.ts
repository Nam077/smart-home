import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsPositive, ValidateNested } from 'class-validator';

export class PaginatedResponseDto<T> {
    /**
     * Create a new PaginatedResponseDto instance from raw data.
     *
     * @template T - Type of items.
     * @param {T[]} items - Array of items for current page.
     * @param {number} total - Total number of items.
     * @param {number} page - Current page number.
     * @param {number} limit - Number of items per page.
     * @param {new () => T} type - Constructor for item type.
     * @returns {PaginatedResponseDto<T>} A new PaginatedResponseDto instance.
     */
    static from<T>(items: T[], total: number, page: number, limit: number, type: new () => T): PaginatedResponseDto<T> {
        const response = new PaginatedResponseDto<T>(type);

        response.items = items;
        response.total = total;
        response.page = page;
        response.limit = limit;
        response.totalPages = Math.ceil(total / limit);
        response.hasNext = page < response.totalPages;
        response.hasPrevious = page > 1;
        response.firstPage = 1;
        response.lastPage = response.totalPages;
        response.nextPage = response.hasNext ? page + 1 : null;
        response.previousPage = response.hasPrevious ? page - 1 : null;

        return response;
    }

    @ApiProperty({
        description: 'Array of items for current page',
        isArray: true,
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type((options) => {
        return (options?.newObject as PaginatedResponseDto<T>)?.type;
    })
    items: T[];

    @ApiProperty({
        description: 'Total number of items',
        example: 100,
    })
    @IsInt()
    @IsPositive()
    total: number;

    @ApiProperty({
        description: 'Current page number',
        example: 1,
    })
    @IsInt()
    @IsPositive()
    page: number;

    @ApiProperty({
        description: 'Number of items per page',
        example: 10,
    })
    @IsInt()
    @IsPositive()
    limit: number;

    @ApiProperty({
        description: 'Total number of pages',
        example: 10,
    })
    @IsInt()
    @IsPositive()
    totalPages: number;

    @ApiProperty({
        description: 'Whether there is a next page',
        example: true,
    })
    @IsBoolean()
    hasNext: boolean;

    @ApiProperty({
        description: 'Whether there is a previous page',
        example: false,
    })
    @IsBoolean()
    hasPrevious: boolean;

    @ApiProperty({
        description: 'First page number',
        example: 1,
    })
    @IsInt()
    @IsPositive()
    firstPage: number;

    @ApiProperty({
        description: 'Last page number',
        example: 10,
    })
    @IsInt()
    @IsPositive()
    lastPage: number;

    @ApiProperty({
        description: 'Next page number (null if no next page)',
        example: 2,
        nullable: true,
    })
    @IsInt()
    @IsPositive()
    nextPage: number | null;

    @ApiProperty({
        description: 'Previous page number (null if no previous page)',
        example: null,
        nullable: true,
    })
    @IsInt()
    @IsPositive()
    previousPage: number | null;

    private type: new () => T;

    constructor(type: new () => T) {
        this.type = type;
    }

    /**
     * Get metadata about the pagination.
     *
     * @returns Object containing pagination metadata.
     */
    getMeta() {
        return {
            total: this.total,
            page: this.page,
            limit: this.limit,
            totalPages: this.totalPages,
            hasNext: this.hasNext,
            hasPrevious: this.hasPrevious,
            firstPage: this.firstPage,
            lastPage: this.lastPage,
            nextPage: this.nextPage,
            previousPage: this.previousPage,
        };
    }
}
