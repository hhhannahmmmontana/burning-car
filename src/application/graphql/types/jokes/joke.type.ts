import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class JokeType {
    @Field(() => Int)
    id: number = 0;

    @Field()
    text: string = "";

    @Field(() => [String])
    tags: string[] = [];

    @Field(() => Int)
    rating: number = 0;

    @Field(() => Int)
    ratesAmount: number = 0;

    @Field()
    createdAt: Date = new Date();

    @Field({ nullable: true })
    authorUsername?: string;
}