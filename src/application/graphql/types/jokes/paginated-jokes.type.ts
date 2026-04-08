import { ObjectType, Field } from '@nestjs/graphql';
import { JokeType } from './joke.type';

@ObjectType()
export class PaginatedJokesType {
    @Field(() => [JokeType])
    jokes: JokeType[] = [];

    @Field({ nullable: true })
    nextToken?: string;

    @Field()
    hasMore: boolean = false;
}