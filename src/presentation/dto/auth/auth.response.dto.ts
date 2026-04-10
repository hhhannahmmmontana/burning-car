import { ApiProperty } from "@nestjs/swagger";
import { UserDto } from "./user.dto";

export class AuthResponseDto {
    @ApiProperty({ 
        description: 'JWT токен',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    access_token: string = "";

    @ApiProperty({ 
        description: 'Данные пользователя',
        type: UserDto
    })
    user: UserDto = new UserDto();
}