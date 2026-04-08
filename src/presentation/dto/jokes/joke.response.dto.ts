 import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Joke } from 'src/domain/entities/joke.entity';

export class JokeResponseDto {
    @ApiProperty()
    @Expose()
    id: number = 0;

    @ApiProperty()
    @Expose()
    text: string = "";

    @ApiProperty({ type: [String], example: ['Смешно', 'Медведь'] })
    @Expose()
    @Transform(({ obj }) => obj.tags?.map((tag: any) => tag.name) ?? [])
    tags: string[] = [];

    @ApiProperty()
    @Expose()
    rating: number = 0;

    @ApiProperty()
    @Expose()
    ratesAmount: number = 0;

    @ApiProperty()
    @Expose()
    author: string | null = null;

    @ApiProperty()
    @Expose()
    authorIpv4: string | null = null;

    @ApiProperty()
    @Expose()
    authorIpv6: string | null = null;

    @ApiProperty()
    @Expose()
    createdAt: Date = new Date();

    public static fromEntity(jokeEntity: Joke): JokeResponseDto {
        const response = new JokeResponseDto();
        response.id = jokeEntity.id;
        response.text = jokeEntity.text;
        response.tags = jokeEntity.tags.map(it => it.name);
        response.rating = jokeEntity.rating;
        response.ratesAmount = jokeEntity.ratesAmount;
        response.author = jokeEntity.author?.username ?? null;
        response.createdAt = jokeEntity.createdAt;
        response.authorIpv4 = jokeEntity.authorIPv4;
        response.authorIpv6 = jokeEntity.authorIPv6;
        return response;
    }
}
