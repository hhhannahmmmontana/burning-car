import { ApiProperty } from "@nestjs/swagger";
import { Commentary } from "src/domain/entities/commentary.entity";

export class CommentResponseDto {
    @ApiProperty({ example: 1 })
    id: number = 0;

    @ApiProperty({ example: 'Очень смешная шутка!' })
    text: string = "";

    @ApiProperty({ example: 'volodyapokalipsis', nullable: true })
    username: string | null = null;

    @ApiProperty({ example: '2026-04-09T14:30:00.000Z' })
    createdAt: Date = new Date();

    static fromEntity(comment: Commentary): CommentResponseDto {
        const dto = new CommentResponseDto();
        dto.id = comment.id;
        dto.text = comment.text;
        dto.username = comment.author?.username ?? null;
        dto.createdAt = comment.createdAt;
        return dto;
    }
}