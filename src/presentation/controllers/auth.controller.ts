import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from "@nestjs/swagger";
import { AuthService } from "src/application/services/auth/auth.service";
import { AuthRequestDto } from "../dto/auth/auth.request.dto";
import { AuthResponseDto } from "../dto/auth/auth.response.dto";

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) {}

    @Post('register')
    @ApiOperation({ 
        summary: 'Регистрация нового пользователя'
    })
    @ApiBody({
        type: AuthRequestDto,
        examples: {
            example: {
                value: {
                    username: 'volodyapokalipsis',
                    password: 'securePassword123'
                }
            }
        }
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Пользователь успешно зарегистрирован',
        type: AuthResponseDto,
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                    username: 'volodyapokalipsis'
                }
            }
        }
    })
    @ApiResponse({ 
        status: 409, 
        description: 'Пользователь уже существует'
    })
    register(@Body() body: AuthRequestDto) {
        return this.authService.register(body.username, body.password);
    }

    @Post('login')
    @ApiOperation({ 
        summary: 'Авторизация пользователя'
    })
    @ApiBody({
        type: AuthRequestDto,
        examples: {
            example: {
                value: {
                    username: 'volodyapokalipsis',
                    password: 'securePassword123'
                }
            }
        }
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Успешная авторизация',
        type: AuthResponseDto,
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                    username: 'volodyapokalipsis'
                }
            }
        }
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Неверные учетные данные'
    })
    login(@Body() body: AuthRequestDto) {
        return this.authService.login(body.username, body.password);
    }
}