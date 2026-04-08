import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as CacheManager from 'cache-manager';
import { JokeService } from '../services/joke.service';
import { Joke } from 'src/domain/entities/joke.entity';
import { PaginatedResponse } from 'src/domain/paginated-response';
import { Signature } from 'src/domain/signature';

@Injectable()
export class BffService {
    private readonly POPULAR_JOKES_TTL = 300;
    private readonly SEARCH_RESULTS_TTL = 60;
    private readonly SINGLE_JOKE_TTL = 600;

    private cachedKeys: Set<string> = new Set();

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: CacheManager.Cache,
        private readonly jokeService: JokeService,
    ) {}

    async getPopularJokes(pageSize: number = 5): Promise<Joke[]> {
        const cacheKey = `popular_jokes:${pageSize}`;
        
        const cached = await this.cacheManager.get<Joke[]>(cacheKey);
        if (cached) {
            console.log(`[CACHE HIT] ${cacheKey}`);
            return cached;
        }

        console.log(`[CACHE MISS] ${cacheKey}`);

        const result = await this.jokeService.searchJokes(
            pageSize,
            null,
            false,
            [],
            null,
            { username: null, authorIpv4: null, authorIpv6: null }
        );

        const sortedJokes = result.value.sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.ratesAmount - a.ratesAmount;
        });

        await this.cacheManager.set(cacheKey, sortedJokes, this.POPULAR_JOKES_TTL);
        this.cachedKeys.add(cacheKey);

        return sortedJokes;
    }

    async searchJokes(
        pageSize: number,
        token: string | null,
        tags: string[],
        search: string | null,
        signature: Signature
    ): Promise<PaginatedResponse<Joke>> {
        const cacheKey = this.buildSearchCacheKey(pageSize, token, tags, search);

        const cached = await this.cacheManager.get<PaginatedResponse<Joke>>(cacheKey);
        if (cached) {
            console.log(`[CACHE HIT] ${cacheKey}`);
            return cached;
        }

        console.log(`[CACHE MISS] ${cacheKey}`);

        const result = await this.jokeService.searchJokes(
            pageSize,
            token,
            false,
            tags,
            search,
            signature
        );

        if (result.value.length > 0) {
            await this.cacheManager.set(cacheKey, result, this.SEARCH_RESULTS_TTL);
            this.cachedKeys.add(cacheKey);
        }

        return result;
    }

    async getJokeById(jokeId: number): Promise<Joke> {
        const cacheKey = `joke:${jokeId}`;

        const cached = await this.cacheManager.get<Joke>(cacheKey);
        if (cached) {
            console.log(`[CACHE HIT] ${cacheKey}`);
            return cached;
        }

        console.log(`[CACHE MISS] ${cacheKey}`);

        const joke = await this.jokeService.getJokeOrThrow(jokeId);
        await this.cacheManager.set(cacheKey, joke, this.SINGLE_JOKE_TTL);
        this.cachedKeys.add(cacheKey);

        return joke;
    }

    async invalidatePopularCache(): Promise<void> {
        for (const key of this.cachedKeys) {
            if (key.startsWith('popular_jokes:')) {
                await this.cacheManager.del(key);
                this.cachedKeys.delete(key);
            }
        }
        console.log('[CACHE INVALIDATED] popular_jokes');
    }

    async invalidateJokeCache(jokeId: number): Promise<void> {
        const key = `joke:${jokeId}`;
        await this.cacheManager.del(key);
        this.cachedKeys.delete(key);
        await this.invalidatePopularCache();
        console.log(`[CACHE INVALIDATED] joke:${jokeId}`);
    }

    async clearAllCache(): Promise<void> {
        for (const key of this.cachedKeys) {
            await this.cacheManager.del(key);
        }
        this.cachedKeys.clear();
        console.log('[CACHE CLEARED] all');
    }

    private buildSearchCacheKey(
        pageSize: number,
        token: string | null,
        tags: string[],
        search: string | null
    ): string {
        const parts = [
            'search',
            `ps:${pageSize}`,
            token ? `t:${token}` : 't:null',
            tags.length > 0 ? `tags:${tags.sort().join(',')}` : 'tags:none',
            search ? `s:${search}` : 's:null',
        ];
        return parts.join(':');
    }
}