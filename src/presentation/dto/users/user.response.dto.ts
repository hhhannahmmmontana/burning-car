import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/domain/entities/user.entity';

export class UserResponseDto {
    @ApiProperty({ example: 'ivan' })
    username: string = "";

    @ApiProperty({ example: '2026-04-08T14:00:20.977Z' })
    createdAt: Date = new Date();

    static fromEntity(user: User): UserResponseDto {
        const dto = new UserResponseDto();
        dto.username = user.username;
        dto.createdAt = user.createdAt;
        return dto;
    }
}