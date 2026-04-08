import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Joke } from "src/domain/entities/joke.entity";
import { Signature } from "src/domain/signature";
import { DataSource, EntityManager } from "typeorm";
import { TagService } from "./tags.service";
import { UserService } from "./user.service";
import { Favourite } from "src/domain/entities/favourite.entity";
import { PaginatedResponse } from "src/domain/paginated-response";
import { decodeToken, encodeToken } from "../pagination";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import * as CacheManager from 'cache-manager';

@Injectable()
export class JokeService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly tagService: TagService,
		private readonly userService: UserService,
		@Inject(CACHE_MANAGER) private cacheManager: CacheManager.Cache
	) {}

	async createJoke(
        text: string,
        tags: string[],
        signature: Signature,
        entityManager?: EntityManager
    ): Promise<Joke> {
        const f = async (entityManager: EntityManager) => {
            const user = await this.userService.findUser(signature.username, entityManager);
            const joke = new Joke();
            joke.text = text;
            joke.tags = [];
            for (let tag of tags) {
                joke.tags.push(await this.tagService.findOrCreateTag(tag, user, signature, entityManager));
            }
            joke.sign(signature, user);
            const saved = await entityManager.save(joke);

            await this.invalidatePopularCache();

            return saved;
        };
        return entityManager ? f(entityManager) : this.dataSource.transaction(f);
    }

    private async invalidatePopularCache(): Promise<void> {
        try {
            for (let i = 1; i <= 50; i++) {
                await this.cacheManager.del(`popular_jokes:${i}`);
            }
        } catch (e) {
            console.error('Cache invalidation error:', e);
        }
    }

	async getJokeOrThrow(
		jokeId: number,
		entityManager?: EntityManager
	): Promise<Joke> {
		const f = async (entityManager: EntityManager) => {
			const joke = await entityManager.findOne(Joke, { where: { id: jokeId } });
			if (joke == null) {
				throw new NotFoundException(`jokeId: ${jokeId}`);
			}
			return joke;
		};
		return entityManager ? f(entityManager) : this.dataSource.transaction(f);
	}

	async searchJokes(
		pageSize: number,
		token: string | null,
		isFavourites: boolean,
		tags: string[],
		search: string | null,
		signature: Signature,
		entityManager?: EntityManager
	): Promise<PaginatedResponse<Joke>> {
		const f = async (entityManager: EntityManager) => {
			const user = await this.userService.findUser(signature.username, entityManager);
			const lastId = decodeToken(token);
			const subQuery = entityManager.createQueryBuilder(Joke, 'joke')
            .select('joke.id')
            .orderBy('joke.id', 'ASC')
            .take(pageSize + 1);

			if (lastId !== null) {
				subQuery.where('joke.id > :lastId', { lastId });
			}

			if (isFavourites && user != null) {
				subQuery.innerJoin(
					Favourite,
					'favourite',
					'favourite.jokeId = joke.id AND favourite.userUsername = :username',
					{ username: user.username }
				);
			}

			if (tags.length > 0) {
				subQuery
					.innerJoin('joke.tags', 'filterTag')
					.andWhere('filterTag.name IN (:...tags)', { tags: tags });
			}

			if (search) {
				subQuery
					.andWhere('joke.text LIKE :search', { search: `%${search}%` })
					.orderBy('joke.ratesAmount', 'DESC')
					.addOrderBy('joke.id', 'ASC');
			}

			const jokeIds = await subQuery.getMany();

			if (jokeIds.length === 0) {
				return { token: null, value: [] };
			}

			const jokes = await entityManager.createQueryBuilder(Joke, 'joke')
				.leftJoinAndSelect('joke.tags', 'tag')
				.whereInIds(jokeIds.map(j => j.id))
				.orderBy('joke.id', 'ASC')
				.getMany();

			let nextToken: string | null = null;
			if (jokes.length > pageSize) {
				nextToken = encodeToken(jokes[pageSize - 1].id);
				jokes.pop();
			}

			return {
				token: nextToken,
				value: jokes,
			};
		};
		return entityManager ? f(entityManager) : this.dataSource.transaction(f);
	}

	async markFavourite(
		jokeId: number,
		username: string,
		entityManager?: EntityManager
	) {
		const f = async (entityManager: EntityManager) => {
			const user = await this.userService.findUserOrThrow(username, entityManager);
			let fav = new Favourite();
			fav.user = user;
			fav.joke = await this.getJokeOrThrow(jokeId);
			entityManager.save(fav)
		};
		return entityManager ? f(entityManager) : this.dataSource.transaction(f);
	}
}