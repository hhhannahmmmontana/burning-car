import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from 'src/application/services/auth/auth.service';
import { TokenResponseDto } from '../dto/auth/token-response.dto';
import { LocalAuthGuard } from 'src/application/services/auth/guards/local-auth.guard';
import { LoginDto } from '../dto/auth/login.dto';
import { RegisterDto } from '../dto/auth/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Регистрация нового пользователя' })
    @ApiResponse({ status: 201, description: 'Успешная регистрация', type: TokenResponseDto })
    @ApiResponse({ status: 409, description: 'Username уже занят' })
    async register(@Body() dto: RegisterDto): Promise<TokenResponseDto> {
        return this.authService.register(dto.username, dto.password);
    }

    @Post('login')
    @UseGuards(LocalAuthGuard)
    @ApiOperation({ summary: 'Вход в систему' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Успешный вход', type: TokenResponseDto })
    @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
    async login(@Request() req): Promise<TokenResponseDto> {
        return this.authService.login(req.user);
    }
}