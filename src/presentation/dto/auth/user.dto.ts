import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
    @ApiProperty({ example: 'volodyapokalipsis' })
    username: string = "";
}