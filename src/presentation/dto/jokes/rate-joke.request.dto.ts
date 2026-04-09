import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, Min, Max } from "class-validator";

export class RateJokeRequestDto {
    @ApiProperty({
        description: 'Оценка шутки',
        example: 5,
        minimum: 1,
        maximum: 5
    })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number = 0;

    @ApiProperty({
        description: 'Имя пользователя',
        example: 'volodyapokalipsis'
    })
    @IsString()
    username: string = "";
}