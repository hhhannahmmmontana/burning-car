// jokes/jokes.resolver.ts
import { Resolver, Query, Args, Int, Context } from '@nestjs/graphql';
import { JokeService } from '../../services/joke.service';
import { JokeType } from '../types/jokes/joke.type';
import { PaginatedJokesType } from '../types/jokes/paginated-jokes.type';
import { SearchJokesInput } from '../types/jokes/input/search-jokes.input';
import { createSignature } from '../../../domain/signature';

@Resolver(() => JokeType)
export class JokesResolver {
    constructor(private readonly jokeService: JokeService) {}

    @Query(() => PaginatedJokesType, { name: 'jokes' })
    async getJokes(
        @Args('input') input: SearchJokesInput,
        @Context() context: any
    ): Promise<PaginatedJokesType> {
        const req = context.req;
        const signature = createSignature(input.username ?? null, req);

        const result = await this.jokeService.searchJokes(
            input.pageSize,
            input.token ?? null,
            input.isFavourites,
            input.tags ?? [],
            input.search ?? null,
            signature
        );

        return {
            jokes: result.value.map(joke => ({
                id: joke.id,
                text: joke.text,
                tags: joke.tags.map(tag => tag.name),
                rating: joke.rating,
                ratesAmount: joke.ratesAmount,
                createdAt: joke.createdAt,
            })),
            nextToken: result.token ?? undefined,
            hasMore: result.token !== null,
        };
    }

    @Query(() => JokeType, { name: 'joke' })
    async getJoke(@Args('id', { type: () => Int }) id: number): Promise<JokeType> {
        const joke = await this.jokeService.getJokeOrThrow(id);
        return {
            id: joke.id,
            text: joke.text,
            tags: joke.tags.map(tag => tag.name),
            rating: joke.rating,
            ratesAmount: joke.ratesAmount,
            createdAt: joke.createdAt,
        };
    }
}