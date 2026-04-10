import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { JokeType } from "./types/joke.type";
import { JokeService } from "src/application/services/joke.service";
import { SearchJokesInput } from "./inputs/search-jokes.input";
import { PaginatedJokeType } from "./types/paginated-joke.type";
import { createSignature } from "src/domain/signature";
import * as express from "express";

@Resolver(() => JokeType)
export class JokesResolver {
    constructor(
        private jokeService: JokeService
    ) {}

    @Query(() => PaginatedJokeType, { name: 'jokes' })
    async jokes(
        @Args('input') input: SearchJokesInput,
        @Context() context: { req: express.Request }
    ): Promise<PaginatedJokeType> {
        const signature = createSignature(input.username ?? null, context.req);

        const result = await this.jokeService.searchJokes(
            input.pageSize,
            input.token ?? null,
            input.sortByPopularity ?? true,
            input.isFavourites ?? false,
            input.tags ?? [],
            input.search ?? null,
            signature
        );

        return PaginatedJokeType.fromPaginatedJoke(result);
    }
}