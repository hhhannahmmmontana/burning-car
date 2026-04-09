import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class GetCommentsRequestDto {
    @ApiProperty({
        description: 'Размер страницы',
        example: 10
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageSize: number = 0;

    @ApiProperty({
        description: 'Токен пагинации',
        required: false
    })
    @IsString()
    @IsOptional()
    token?: string;
}