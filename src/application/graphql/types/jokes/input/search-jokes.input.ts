import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class SearchJokesInput {
    @Field(() => Int, { defaultValue: 10 })
    pageSize: number = 10;

    @Field({ nullable: true })
    token?: string;

    @Field(() => [String], { nullable: true, defaultValue: [] })
    tags?: string[];

    @Field({ nullable: true })
    search?: string;

    @Field({ defaultValue: false })
    isFavourites: boolean = false;

    @Field({ nullable: true })
    username?: string;
}