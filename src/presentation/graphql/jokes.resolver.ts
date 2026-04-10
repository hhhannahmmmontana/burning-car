import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { JokeType } from "./types/joke.type";
import { JokeService } from "src/application/services/joke.service";
import { SearchJokesInput } from "./inputs/search-jokes.input";
import { PaginatedJokeType } from "./types/paginated-joke.type";
import { createSignature } from "src/domain/signature";
import * as express from "express";
import { UseGuards } from "@nestjs/common";
import { GraphQlAuthGuard } from "../guards/graphql-auth.guard";
import { UserDto } from "../dto/auth/user.dto";

@Resolver(() => JokeType)
export class JokesResolver {
    constructor(
        private jokeService: JokeService
    ) {}

    @Query(() => PaginatedJokeType, { name: 'jokes' })
    @UseGuards(GraphQlAuthGuard)
    async jokes(
        @Args('input') input: SearchJokesInput,
        @Context() context: { req: express.Request, user?: UserDto }
    ): Promise<PaginatedJokeType> {
        const signature = createSignature(context.user?.username ?? null, context.req);
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