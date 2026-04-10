import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";
import { AuthService } from "src/application/services/auth/auth.service";

export class AuthRequestDto {
    @ApiProperty({ 
        description: 'Имя пользователя',
        example: 'volodyapokalipsis'
    })
    @IsString()
    @MinLength(AuthService.MIN_USERNAME_LENGTH)
    username: string = "";

    @ApiProperty({ 
        description: 'Пароль',
        example: 'securePassword123',
        minLength: AuthService.MIN_PASSWORD_LENGTH
    })
    @IsString()
    @MinLength(AuthService.MIN_PASSWORD_LENGTH)
    password: string = "";
}