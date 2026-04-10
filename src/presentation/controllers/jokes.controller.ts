import { Body, Controller, Get, Post, Param, Query, Req, ParseIntPipe, Delete, HttpCode, ParseFloatPipe, UseGuards } from "@nestjs/common";
import { JokeService } from "src/application/services/joke.service";
import { SearchJokesDto } from "../dto/jokes/search-jokes.request.dto";
import { createSignature } from "src/domain/signature";
import * as express from 'express';
import { PaginatedResponse } from "src/domain/paginated-response";
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { JokeResponseDto } from "../dto/jokes/joke.response.dto";
import { CreateJokeRequestDto } from "../dto/jokes/create-joke.request.dto";
import { CreateCommentRequestDto } from "../dto/jokes/create-comment.request.dto";
import { CommentResponseDto } from "../dto/jokes/comment.response.dto";
import { GetCommentsRequestDto } from "../dto/jokes/get-comments.request.dto";
import { UserJoke } from "src/domain/entities/user-joke.entity";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { CurrentUser } from "../extras/decorators/current-user.decorator";
import { UserDto } from "../dto/auth/user.dto";
import { OptionalJwtAuthGuard } from "../guards/optional-jwt-auth.guard";

@ApiTags("Jokes")
@Controller("jk")
export class JokesController {
    constructor(private readonly jokesService: JokeService) {}

    @Post()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Создать новую шутку'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Шутка успешно создана',
        type: UserJoke
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
    async create(
        @Body() dto: CreateJokeRequestDto,
        @Req() req: express.Request,
        @CurrentUser() user?: UserDto,
    ): Promise<JokeResponseDto> {
        return JokeResponseDto.fromEntity(
            await this.jokesService.createJoke(
                dto.text,
                dto.tags,
                createSignature(user?.username ?? null, req)
            )
        );
    }

    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth('access-token')
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
        type: UserJoke
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Шутка не найдена'
    })
    async getJoke(
        @Param('id', ParseIntPipe)
        id: number,
        @CurrentUser()
        user?: UserDto,
    ): Promise<JokeResponseDto> {
        return JokeResponseDto.fromEntity(await this.jokesService.getJoke(id, user?.username ?? null));
    }

    @Get()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Поиск шуток',
        description: 'Поиск с пагинацией, фильтрацией по тегам и тексту'
    })
    @ApiQuery({ name: 'pageSize', description: 'Размер страницы', type: Number, example: 10 })
    @ApiQuery({ name: 'token', description: 'Токен пагинации', required: false, type: String })
    @ApiQuery({ name: 'sortByPopularity', description: 'Сортировать по популярности', required: false, type: Boolean })
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
        @Req() req: express.Request,
        @CurrentUser() user?: UserDto
    ): Promise<PaginatedResponse<JokeResponseDto>> {
        const res = await this.jokesService.searchJokes(
            dto.pageSize,
            dto.token ?? null,
            dto.sortByPopularity ?? true,
            dto.isFavourites ?? false,
            dto.tags ?? [],
            dto.search ?? null,
            createSignature(user?.username ?? null, req)
        );
        return {
            token: res.token,
            value: res.value.map(it => JokeResponseDto.fromEntity(it))
        };
    }

    @Post(':id/favourite')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
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
        @CurrentUser() user: UserDto
    ): Promise<void> {
        return this.jokesService.addToFavourites(id, user.username);
    }

    @Delete(':id/favourite')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
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
        @CurrentUser() user: UserDto
    ): Promise<void> {
        return this.jokesService.removeFromFavourites(id, user.username);
    }

    @Post(':id/rate')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ 
        summary: 'Оценить шутку'
    })
    @ApiParam({ 
        name: 'id', 
        description: 'ID шутки', 
        type: Number,
        example: 1
    })
    @ApiParam({ 
        name: 'rating', 
        description: 'Оценка', 
        type: Number,
        example: 5
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
        @Query('rating', ParseFloatPipe) rating: number,
        @CurrentUser() user: UserDto
    ) {
        return await this.jokesService.rateJoke(id, rating, user.username);
    }

    @Post(':id/comment')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth('access-token')
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
        @Req() req: express.Request,
        @CurrentUser() user?: UserDto
    ): Promise<CommentResponseDto> {
        return CommentResponseDto.fromEntity(
            await this.jokesService.comment(
                id,
                dto.text,
                createSignature(user?.username ?? null, req)
            )
        );
    }

    @Get(':jokeId/comments')
    @ApiOperation({ 
        summary: 'Получить комментарии к шутке'
    })
    @ApiParam({ 
        name: 'jokeId', 
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
        @Param('jokeId', ParseIntPipe) jokeId: number,
        @Query() dto: GetCommentsRequestDto
    ): Promise<PaginatedResponse<CommentResponseDto>> {
        const res = await this.jokesService.getComments(
            jokeId,
            dto.pageSize,
            dto.token ?? null
        );
        return {
            token: res.token,
            value: res.value.map(it => CommentResponseDto.fromEntity(it))
        };
    }
}