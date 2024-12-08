import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString, IsEnum } from 'class-validator';
import { split } from 'lodash';

export class PaginationDto {
    @ApiProperty({
        description: 'Page number (1-based)',
        minimum: 1,
        default: 1,
        required: false,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page',
        minimum: 1,
        maximum: 100,
        default: 10,
        required: false,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number = 10;

    @ApiProperty({
        description: 'Sort field',
        required: false,
        example: 'createdAt',
    })
    @IsString()
    @IsOptional()
    sortBy?: string = 'createdAt';

    @ApiProperty({
        description: 'Sort order (ASC or DESC)',
        required: false,
        enum: ['ASC', 'DESC'],
        default: 'DESC',
    })
    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    order?: 'ASC' | 'DESC' = 'DESC';

    @ApiProperty({
        description: 'Search term for full-text search',
        required: false,
        example: 'john',
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({
        description: 'Comma-separated list of fields to select',
        required: false,
        example: 'id,name,email',
    })
    @IsString()
    @IsOptional()
    select?: string;

    @ApiProperty({
        description: 'Comma-separated list of relations to include',
        required: false,
        example: 'profile,roles',
    })
    @IsString()
    @IsOptional()
    relations?: string;

    @ApiProperty({
        description: 'Filter criteria in JSON format',
        required: false,
        example: '{"status":"active"}',
    })
    @IsString()
    @IsOptional()
    filter?: string;

    get skip(): number {
        return (this.page - 1) * this.limit;
    }

    getOrder() {
        return { [this.sortBy]: this.order };
    }

    getSelect(): string[] | undefined {
        return split(this.select, ',').map((field) => field.trim());
    }

    getRelations(): string[] | undefined {
        return split(this.relations, ',').map((relation) => relation.trim());
    }

    getFilter(): Record<string, any> | undefined {
        return this.filter ? JSON.parse(this.filter) : undefined;
    }
}
