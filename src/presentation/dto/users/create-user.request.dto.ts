import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserRequestDto {
    @ApiProperty({
        description: 'Имя пользователя',
        example: 'volodyapokalipsis',
        minLength: 3,
        maxLength: 50
    })
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username: string = "";

    @ApiProperty({
        description: 'Пароль',
        example: 'secretPassword123',
        minLength: 8
    })
    @IsString()
    @MinLength(8)
    password: string = "";
}