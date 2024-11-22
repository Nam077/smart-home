import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from './pagination.dto';

export class QueryFilterDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Search term to filter results',
        type: String,
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by field values (JSON string)',
        type: String,
        example: '{"status":"active"}',
    })
    @IsOptional()
    @IsString()
    filter?: string;

    @ApiPropertyOptional({
        description: 'Select specific fields (comma-separated)',
        type: String,
        example: 'id,name,email',
    })
    @IsOptional()
    @IsString()
    select?: string;

    @ApiPropertyOptional({
        description: 'Include related entities (comma-separated)',
        type: String,
        example: 'profile,roles',
    })
    @IsOptional()
    @IsString()
    relations?: string;
}
