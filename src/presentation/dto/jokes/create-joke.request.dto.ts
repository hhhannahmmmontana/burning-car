// dto/create-joke.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsArray, IsOptional, MinLength, MaxLength } from "class-validator";

export class CreateJokeRequestDto {
    @ApiProperty({
        description: "Текст анекдота",
        example: "Сел медведь в машину и сгорел"
    })
    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    text: string = "";

    @ApiProperty({
        description: "Теги",
        example: ["Смешно", "Медведь"],
        type: [String]
    })
    @IsArray()
    @IsString({ each: true })
    tags: string[] = [];

    @ApiPropertyOptional({
        description: "Никнейм автора",
        example: "volodyapokalipsis",
        nullable: true
    })
    @IsOptional()
    @IsString()
    username?: string | null;
}