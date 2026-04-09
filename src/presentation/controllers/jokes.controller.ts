import { Body, Controller, Get, Post, Param, Query, Req, ParseIntPipe, Delete, HttpCode } from "@nestjs/common";
import { JokeService } from "src/application/services/joke.service";
import { SearchJokesDto } from "../dto/jokes/search-jokes.request.dto";
import { MarkFavouriteDto } from "../dto/jokes/mark-favourite.request.dto";
import { createSignature } from "src/domain/signature";
import * as express from 'express';
import { Joke } from "src/domain/entities/joke.entity";
import { PaginatedResponse } from "src/domain/paginated-response";
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from "@nestjs/swagger";
import { JokeResponseDto } from "../dto/jokes/joke.response.dto";
import { CreateJokeRequestDto } from "../dto/jokes/create-joke.request.dto";
import { RateJokeRequestDto } from "../dto/jokes/rate-joke.request.dto";
import { CreateCommentRequestDto } from "../dto/jokes/create-comment.request.dto";
import { CommentResponseDto } from "../dto/jokes/comment.response.dto";
import { GetCommentsRequestDto } from "../dto/jokes/get-comments.request.dto";

@ApiTags("Jokes")
@Controller("jokes")
export class JokesController {
    constructor(private readonly jokesService: JokeService) {}

    @Post()
    @ApiOperation({ 
        summary: 'Создать новую шутку'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Шутка успешно создана',
        type: Joke
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Пользователь не найден',
        schema: {
            example: {
                statusCode: 404,
                message: 'username: {username}',
                error: 'Not Found'
            }
        }
    })
    async create(@Body() dto: CreateJokeRequestDto, @Req() req: express.Request): Promise<JokeResponseDto> {
        return JokeResponseDto.fromEntity(
            await this.jokesService.createJoke(dto.text, dto.tags, createSignature(dto.username ?? null, req))
        );
    }

    @Get(':id')
    @ApiOperation({ 
        summary: 'Получить шутку по ID'
    })
    @ApiParam({ 
        name: 'id', 
        description: 'ID шутки', 
        type: Number,
        example: 1
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Шутка найдена',
        type: Joke
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Шутка не найдена'
    })
    async getJoke(@Param('id', ParseIntPipe) id: number): Promise<JokeResponseDto> {
        return JokeResponseDto.fromEntity(await this.jokesService.getJokeOrThrow(id));
    }

    @Get()
    @ApiOperation({ 
        summary: 'Поиск шуток',
        description: 'Поиск с пагинацией, фильтрацией по тегам и тексту'
    })
    @ApiQuery({ name: 'pageSize', description: 'Размер страницы', type: Number, example: 10 })
    @ApiQuery({ name: 'token', description: 'Токен пагинации', required: false, type: String })
    @ApiQuery({ name: 'isFavourites', description: 'Только избранные', required: false, type: Boolean })
    @ApiQuery({ name: 'tags', description: 'Фильтр по тегам', required: false, type: [String] })
    @ApiQuery({ name: 'search', description: 'Поиск по тексту', required: false, type: String })
    @ApiQuery({ name: 'username', description: 'Имя пользователя', required: false, type: String })
    @ApiResponse({ 
        status: 200, 
        description: 'Список шуток'
    })
    async searchJokes(
        @Query() dto: SearchJokesDto,
        @Req() req: express.Request
    ): Promise<PaginatedResponse<JokeResponseDto>> {
        const res = await this.jokesService.searchJokes(
            dto.pageSize,
            dto.token ?? null,
            dto.isFavourites ?? false,
            dto.tags ?? [],
            dto.search ?? null,
            createSignature(dto.username, req)
        );
        return {
            token: res.token,
            value: res.value.map(it => JokeResponseDto.fromEntity(it))
        };
    }

    @Post(':id/favourite')
    @ApiOperation({ 
        summary: 'Добавить шутку в избранное'
    })
    @ApiParam({ 
        name: 'id',
        description: 'ID шутки', 
        type: Number,
        example: 1
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Шутка добавлена в избранное'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Шутка или пользователь не найден'
    })
    @ApiResponse({ 
        status: 409, 
        description: 'Шутка уже в избранном'
    })
    addToFavourites(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: MarkFavouriteDto
    ): Promise<void> {
        return this.jokesService.addToFavourites(id, dto.username);
    }

    @Delete(':id/favourite')
    @HttpCode(204)
    @ApiOperation({ 
        summary: 'Убрать шутку из избранного'
    })
    @ApiParam({ 
        name: 'id',
        description: 'ID шутки', 
        type: Number,
        example: 1
    })
    @ApiResponse({ 
        status: 204, 
        description: 'Шутка удалена из избранного'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Шутка или пользователь не найдены'
    })
    removeFromFavourites(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: MarkFavouriteDto
    ): Promise<void> {
        return this.jokesService.removeFromFavourites(id, dto.username);
    }

    @Post(':id/rate')
    @ApiOperation({ 
        summary: 'Оценить шутку'
    })
    @ApiParam({ 
        name: 'id', 
        description: 'ID шутки', 
        type: Number,
        example: 1
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Оценка успешно добавлена'
    })
    @ApiResponse({ 
        status: 404,
        description: 'Шутка или пользователь не найден',
        schema: {
            example: {
                statusCode: 404,
                message: 'Joke not found',
                error: 'Not Found'
            }
        }
    })
    async rateJoke(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RateJokeRequestDto
    ) {
        return await this.jokesService.rateJoke(id, dto.rating, dto.username)
    }

    @Post(':id/comments')
    @ApiOperation({ 
        summary: 'Добавить комментарий к шутке'
    })
    @ApiParam({ 
        name: 'id', 
        description: 'ID шутки', 
        type: Number,
        example: 1
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Комментарий успешно добавлен',
        type: CommentResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Шутка или пользователь не найден'
    })
    @ApiResponse({ 
        status: 413, 
        description: 'Слишком большое количество символов'
    })
    async comment(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateCommentRequestDto,
        @Req() req: express.Request
    ): Promise<CommentResponseDto> {
        return CommentResponseDto.fromEntity(
            await this.jokesService.comment(
                id,
                dto.text,
                createSignature(dto.username ?? null, req)
            )
        );
    }

    @Get(':id/comments')
    @ApiOperation({ 
        summary: 'Получить комментарии к шутке'
    })
    @ApiParam({ 
        name: 'id', 
        description: 'ID шутки', 
        type: Number,
        example: 1
    })
    @ApiQuery({ 
        name: 'pageSize', 
        description: 'Размер страницы', 
        type: Number, 
        example: 10 
    })
    @ApiQuery({ 
        name: 'token', 
        description: 'Токен пагинации', 
        required: false, 
        type: String 
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Список комментариев'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Шутка не найдена'
    })
    async getComments(
        @Param('id', ParseIntPipe) id: number,
        @Query() dto: GetCommentsRequestDto
    ): Promise<PaginatedResponse<CommentResponseDto>> {
        const res = await this.jokesService.getComments(
            id,
            dto.pageSize,
            dto.token ?? null
        );
        return {
            token: res.token,
            value: res.value.map(it => CommentResponseDto.fromEntity(it))
        };
    }
}