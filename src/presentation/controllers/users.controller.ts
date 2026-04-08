import { Body, Controller, Get, Post, Param } from "@nestjs/common";
import { UserService } from "src/application/services/user.service";
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from "@nestjs/swagger";
import { CreateUserRequestDto } from "../dto/users/create-user.request.dto";
import { UserResponseDto } from "../dto/users/user.response.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
    constructor(private readonly userService: UserService) {}

    @Post()
    @ApiOperation({ 
        summary: 'Создать нового пользователя'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Пользователь успешно создан',
        type: UserResponseDto
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Пользователь уже существует',
        schema: {
            example: {
                statusCode: 400,
                message: 'User already exists',
                error: 'Bad Request'
            }
        }
    })
    async create(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
        const user = await this.userService.createUser(dto.username, dto.password);
        return UserResponseDto.fromEntity(user);
    }

    @Get(':username')
    @ApiOperation({ 
        summary: 'Получить пользователя по username'
    })
    @ApiParam({ 
        name: 'username', 
        description: 'Имя пользователя', 
        type: String,
        example: 'ivan'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Пользователь найден',
        type: UserResponseDto
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
    async getUser(@Param('username') username: string): Promise<UserResponseDto> {
        const user = await this.userService.findUserOrThrow(username);
        return UserResponseDto.fromEntity(user);
    }
}