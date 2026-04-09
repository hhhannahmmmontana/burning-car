import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MarkFavouriteDto {
    @ApiProperty({
        description: 'Имя пользователя',
        example: 'volodyapokalipsis'
    })
    @IsString()
    username: string;
}