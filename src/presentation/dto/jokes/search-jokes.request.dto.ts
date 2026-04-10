import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsBoolean, IsArray, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchJokesDto {
    @ApiProperty({
        description: 'Размер страницы',
        example: 10
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageSize: number = 1;

    @ApiPropertyOptional({
        description: 'Токен пагинации'
    })
    @IsOptional()
    @IsString()
    token: string = "";

    @ApiPropertyOptional({
        description: 'Сортировать по популярности',
        example: true
    })
    @IsOptional()
    @Transform(({ value }) => value !== 'false')
    @IsBoolean()
    sortByPopularity: boolean = true;

    @ApiPropertyOptional({
        description: 'Только избранные',
        example: false
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isFavourites: boolean = false;

    @ApiPropertyOptional({
        description: 'Фильтр по тегам',
        type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => Array.isArray(value) ? value : [value])
    tags: string[] | null = null;

    @ApiPropertyOptional({
        description: 'Поиск по тексту'
    })
    @IsOptional()
    @IsString()
    search: string | null = null;

    @ApiPropertyOptional({
        description: 'Имя пользователя'
    })
    @IsOptional()
    @IsString()
    username: string | null = null;
}