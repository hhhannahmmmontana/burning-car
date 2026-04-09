 import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Joke } from 'src/domain/entities/joke.entity';
import { UserJoke } from 'src/domain/entities/user-joke.entity';

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
    createdAt: Date = new Date();

    @ApiProperty()
    @Expose()
    isFavourite: boolean = false;

    @ApiProperty()
    @Expose()
    userRating: number | null = null;

    public static fromEntity(jokeEntity: UserJoke): JokeResponseDto {
        const response = new JokeResponseDto();
        response.id = jokeEntity.id;
        response.text = jokeEntity.text;
        response.tags = jokeEntity.tags.map(it => it.name);
        response.rating = jokeEntity.rating;
        response.ratesAmount = jokeEntity.ratesAmount;
        response.author = jokeEntity.author?.username ?? null;
        response.createdAt = jokeEntity.createdAt;
        response.isFavourite = jokeEntity.isFavourite;
        response.userRating = jokeEntity.userRating;
        return response;
    }
}
