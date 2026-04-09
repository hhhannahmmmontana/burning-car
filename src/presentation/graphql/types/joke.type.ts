import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import { it } from "node:test";
import { UserJoke } from "src/domain/entities/user-joke.entity";

@ObjectType()
export class JokeType {
    @Field(() => Int)
    id: number;

    @Field(() => String)
    text: string;

    @Field(() => [String])
    tags: string[];

    @Field(() => Float)
    rating: number;

    @Field(() => Int)
    ratesAmount: number;

    @Field(() => String, { nullable: true })
    author?: string;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Boolean)
    isFavourite: boolean;

    @Field(() => Float, { nullable: true })
    userRating?: number;

    public static fromUserJoke(joke: UserJoke): JokeType {
        return {
            id: joke.id,
            text: joke.text,
            tags: joke.tags.map(it => it.name),
            rating: joke.rating,
            ratesAmount: joke.ratesAmount,
            author: joke.author?.username ?? undefined,
            createdAt: joke.createdAt,
            isFavourite: joke.isFavourite,
            userRating: joke.userRating ?? undefined
        };
    }
}
