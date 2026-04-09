import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";
import { Commentary } from "src/domain/entities/commentary.entity";

export class CreateCommentRequestDto {
    @ApiProperty({
        description: 'Текст комментария',
        example: 'Очень смешная шутка!'
    })
    @IsString()
    @MinLength(1)
    @MaxLength(Commentary.MAX_LENGTH)
    text: string = "";

    @ApiProperty({
        description: 'Имя пользователя (опционально)',
        example: 'volodyapokalipsis',
        required: false
    })
    @IsString()
    @IsOptional()
    username?: string;
}