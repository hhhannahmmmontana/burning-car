import { ApiProperty } from "@nestjs/swagger";

export class CreateJokeRequestDto {
    @ApiProperty({
        description: "Текст анекдота",
        example: "Сел медведь в машину и сгорел"
    })
    public text: string = "";

    @ApiProperty({
        description: "Теги",
        example: ["Смешно", "Медведь"]
    })
    public tags: string[] = [];

    @ApiProperty({
        description: "Никнейм автора",
        example: "volodyapokalipsis"
    })
    public username: string = "";
}