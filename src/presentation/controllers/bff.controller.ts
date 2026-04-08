// bff/bff.controller.ts
import { Controller, Get, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import * as express from 'express';
import { BffService } from '../../application/bff/bff.service';
import { createSignature } from '../../domain/signature';
import { JokeResponseDto } from '../dto/jokes/joke.response.dto';

@ApiTags('BFF')
@Controller('bff')
export class BffController {
    constructor(private readonly bffService: BffService) {}

    @Get('popular')
    @ApiOperation({ summary: 'Получить популярные анекдоты (кэшируется)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Список популярных анекдотов' })
    async getPopularJokes(
        @Query('limit') limit: number = 10
    ): Promise<JokeResponseDto[]> {
        const jokes = await this.bffService.getPopularJokes(limit);
        return jokes.map(joke => JokeResponseDto.fromEntity(joke));
    }

    @Get('jokes/:id')
    @ApiOperation({ summary: 'Получить анекдот по ID (кэшируется)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Анекдот найден' })
    @ApiResponse({ status: 404, description: 'Анекдот не найден' })
    async getJoke(
        @Param('id', ParseIntPipe) id: number
    ): Promise<JokeResponseDto> {
        const joke = await this.bffService.getJokeById(id);
        return JokeResponseDto.fromEntity(joke);
    }

    @Get('search')
    @ApiOperation({ summary: 'Поиск анекдотов (кэшируется)' })
    @ApiQuery({ name: 'pageSize', type: Number, example: 10 })
    @ApiQuery({ name: 'token', required: false, type: String })
    @ApiQuery({ name: 'tags', required: false, type: [String] })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Результаты поиска' })
    async searchJokes(
        @Query('pageSize', ParseIntPipe) pageSize: number,
        @Query('token') token?: string,
        @Query('tags') tags?: string | string[],
        @Query('search') search?: string,
        @Req() req?: express.Request
    ) {
        const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);
        const signature = createSignature(null, req!);

        const result = await this.bffService.searchJokes(
            pageSize,
            token ?? null,
            tagsArray,
            search ?? null,
            signature
        );

        return {
            token: result.token,
            value: result.value.map(joke => JokeResponseDto.fromEntity(joke)),
        };
    }
}