import { ConflictException, Injectable, Inject, NotFoundException, PayloadTooLargeException } from "@nestjs/common";
import { Joke } from "src/domain/entities/joke.entity";
import { Signature } from "src/domain/signature";
import { DataSource, EntityManager } from "typeorm";
import { TagService } from "./tags.service";
import { UserService } from "./user.service";
import { Favourite } from "src/domain/entities/favourite.entity";
import { PaginatedResponse } from "src/domain/paginated-response";
import { decodeToken, encodeToken } from "../pagination";
import { User } from "src/domain/entities/user.entity";
import { Rating } from "src/domain/entities/rating.entity";
import { Commentary } from "src/domain/entities/commentary.entity";
import { UserJoke } from "../../domain/entities/user-joke.entity";
import { CacheService } from "./cache.service";

@Injectable()
export class JokeService {
	private readonly INVALIDATIVE_PAGE_SIZES = [5, 10, 15];
	private readonly POPULARITY_INVALIDATION_TRESHOLD = 100;

	constructor(
		private readonly dataSource: DataSource,
		private readonly tagService: TagService,
		private readonly userService: UserService,
		private readonly cacheService: CacheService<PaginatedResponse<UserJoke>>
	) {
		cacheService.baseSection = "jokes"
	}

	async createJoke(
        text: string,
        tags: string[],
        signature: Signature,
        em?: EntityManager
    ): Promise<UserJoke> {
        const f = async (em: EntityManager) => {
			let user: User | null = null;
			if (signature.username) {
				user = await this.userService.getUserOrThrow(signature.username, em);
			}

            const joke = new Joke();
            joke.text = text;
            joke.tags = [];
            for (let tag of tags) {
                joke.tags.push(await this.tagService.findOrCreateTag(tag, user, signature, em));
            }
            joke.sign(signature, user);
            const saved = await em.save(joke);
			await this.invalidateCache(tags);
            return UserJoke.fromJokeUnauthorized(saved);
        };
        return em ? f(em) : this.dataSource.transaction(f);
    }

	async getJoke(
		jokeId: number,
		username: string | null,
		em?: EntityManager
	): Promise<UserJoke> {
		const f = async (em : EntityManager) => {
			const joke = await em.findOne(Joke, {
				where: { id: jokeId },
				relations: ['tags', 'author']
			});
			
			if (joke == null) {
				throw new NotFoundException(`jokeId: ${jokeId}`);
			}

			if (!username) {
				return UserJoke.fromJokeUnauthorized(joke);
			}

			const favourite = await em.findOne(Favourite, {
				where: {
					user: { username },
					joke: { id: jokeId }
				}
			});

			const rating = await em.findOne(Rating, {
				where: {
					user: { username },
					joke: { id: jokeId }
				}
			});

			return UserJoke.fromJoke(
				joke,
				favourite != null,
				rating?.score ?? null
			);
		};
		
		return em ? f(em) : this.dataSource.transaction(f);
	}

	private async getJokeOrThrow(
		jokeId: number,
		em?: EntityManager
	): Promise<Joke> {
		const f = async (em: EntityManager) => {
			const joke = await em.findOne(
				Joke, {
					where: { id: jokeId },
					relations: ['tags', 'author']
				}
			);
			
			if (joke == null) {
				throw new NotFoundException(`jokeId: ${jokeId}`);
			}
			return joke;
		};
		return em ? f(em) : this.dataSource.transaction(f);
	}

	async searchJokes(
        pageSize: number,
        token: string | null,
        sortByPopularity: boolean,
        isFavourites: boolean,
        tags: string[],
        search: string | null,
        signature: Signature,
        em?: EntityManager
    ): Promise<PaginatedResponse<UserJoke>> {
        if (this.shouldCachePopular(sortByPopularity, isFavourites, tags, search, token)) {
            return this.getCachedPopular(pageSize, signature, em);
        }

        if (this.shouldCacheTags(sortByPopularity, tags, isFavourites, search, token)) {
            return this.getCachedByTags(pageSize, sortByPopularity, tags[0], signature, em);
        }

        return this.executeSearch(pageSize, token, sortByPopularity, isFavourites, tags, search, signature, em);
    }

	private shouldCachePopular(
        sortByPopularity: boolean,
        isFavourites: boolean,
        tags: string[],
        search: string | null,
        token: string | null
    ): boolean {
        return sortByPopularity 
            && !isFavourites 
            && tags.length === 0
            && !search 
            && !token;
    }

	private shouldCacheTags(
		sortByPopularity: boolean,
        tags: string[],
        isFavourites: boolean,
        search: string | null,
		token: string | null
    ): boolean {
        return sortByPopularity
			&& tags.length === 1
			&& !isFavourites
			&& !search
			&& !token;
    }

	private async getCachedPopular(
        pageSize: number,
        signature: Signature,
        em?: EntityManager
    ): Promise<PaginatedResponse<UserJoke>> {
        const key = this.cacheService.createKeyBuilder()
			.addValue("popular")
			.addSection(pageSize)
			.build();

        const cached = await this.cacheService.get(key);
        if (cached) {
            return cached;
        }

        const result = await this.executeSearch(
            pageSize, null, true, false, [], null, signature, em
        );

        await this.cacheService.set(key, result, 300000);
        return result;
    }

    async getCachedByTags(
        pageSize: number,
        sortByPopularity: boolean,
        tag: string,
        signature: Signature,
        em?: EntityManager
    ): Promise<PaginatedResponse<UserJoke>> {
        const key = this.cacheService.createKeyBuilder()
			.addValue("tags")
			.addSection(tag)
			.addSection(pageSize)
			.build();

        const cached = await this.cacheService.get(key);
        if (cached) {
            return cached;
        }

        const result = await this.executeSearch(
            pageSize, null, sortByPopularity, false, [tag], null, signature, em
        );

        await this.cacheService.set(key, result, 120000);
        return result;
    }

	private async executeSearch(
		pageSize: number,
		token: string | null,
		sortByPopularity: boolean,
		isFavourites: boolean,
		tags: string[],
		search: string | null,
		signature: Signature,
		em?: EntityManager
	): Promise<PaginatedResponse<UserJoke>> {
		const f = async (em: EntityManager) => {
			let user: User | null = null;
			if (signature.username != null) {
				user = await this.userService.getUserOrThrow(signature.username, em);
			}
			const lastId = decodeToken(token);
			const query = em
				.createQueryBuilder(Joke, 'joke')
				.leftJoinAndSelect('joke.author', 'author')
				.leftJoinAndSelect('joke.tags', 'tag')
				.orderBy('joke.id', 'DESC')
				.take(pageSize + 1);

			if (lastId !== null) {
				query.where('joke.id > :lastId', { lastId });
			}

			if (isFavourites) {
				if (user == null) {
					return {
						token: "",
						value: []
					};
				}
				query.innerJoin(
					Favourite,
					'favourite',
					'favourite.joke_id = joke.id AND favourite.user_username = :username',
					{ username: user.username }
				);
			}

			if (tags.length > 0) {
				query.andWhere('tag.name IN (:...tags)', { tags: tags });
			}

			if (search) {
				const tsQuery = search
					.trim()
					.split(/\s+/)
					.filter(word => word.length > 0)
					.map(word => `${word}:*`)
					.join(' & ');

				query
					.andWhere(
						`(to_tsvector('russian', joke.text) @@ to_tsquery('russian', :search)
						OR to_tsvector('english', joke.text) @@ to_tsquery('english', :search))`,
						{ search: tsQuery }
        			);
			}

			if (sortByPopularity) {
				query
					.orderBy('joke.ratesAmount', 'DESC')
					.addOrderBy('joke.id', 'DESC');
			}

			const jokes = await query.getMany();

			if (jokes.length == 0) {
				return {
					token: null,
					value: []
				}
			}

			let nextToken: string | null = null;
			if (jokes.length > pageSize) {
				nextToken = encodeToken(jokes[pageSize - 1].id);
				jokes.pop();
			}

			if (!user) {
            	return {
               		token: nextToken,
					value: jokes.map(UserJoke.fromJokeUnauthorized)
				};
			}

			const jokeIds = jokes.map(j => j.id);
			
			const favourites = await em
				.createQueryBuilder(Favourite, 'fav')
				.leftJoinAndSelect('fav.joke', 'joke')
				.where('fav.user_username = :username', { username: user.username })
				.andWhere('fav.joke_id IN (:...jokeIds)', { jokeIds })
				.getMany();
			
			const favouriteJokeIds = new Set(favourites.map(f => f.joke.id));

			const ratings = await em
				.createQueryBuilder(Rating, 'rating')
				.leftJoinAndSelect('rating.joke', 'joke')
				.where('rating.user_username = :username', { username: user.username })
				.andWhere('rating.joke_id IN (:...jokeIds)', { jokeIds })
				.getMany();

			const userRatingsMap = new Map<number, number>(ratings.map((r: Rating) => [r.joke.id, r.score]));

			return {
				token: nextToken,
				value: jokes.map(
					joke => UserJoke.fromJoke(
						joke,
						favouriteJokeIds.has(joke.id),
						userRatingsMap.get(joke.id) ?? null
					)
				)
			};
		};
		return em ? f(em) : this.dataSource.transaction(f);
	}

	async addToFavourites(
		jokeId: number,
		username: string,
		em?: EntityManager
	) {
		const f = async (em: EntityManager) => {
			const user = await this.userService.getUserOrThrow(username, em);
			const existing = await em.findOne(
				Favourite, {
					where: {
						user: { username: user.username},
						joke: { id: jokeId }
					}
				}
			);
			if (existing == null) {
				let fav = new Favourite();
				fav.user = user;
				fav.joke = await this.getJokeOrThrow(jokeId);
				await em.save(fav);
			} else {
				throw new ConflictException(`jokeId: ${jokeId}, username: ${username}`);
			}
		};
		return em ? f(em) : this.dataSource.transaction(f);
	}

	async removeFromFavourites(
		jokeId: number,
		username: string,
		em?: EntityManager
	) {
		const f = async (em: EntityManager) => {
			const user = await this.userService.getUserOrThrow(username, em);
			const existing = await em.findOne(
				Favourite, {
					where: {
						user: { username: user.username},
						joke: { id: jokeId }
					}
				}
			);
			if (existing != null) {
				await em.remove(existing);
			}
		};
		return em ? f(em) : this.dataSource.transaction(f);
	}

	async rateJoke(
		jokeId: number,
		rating: number,
		username: string,
		em?: EntityManager
	) {
		const f = async (em: EntityManager) => {
			const joke = await this.getJokeOrThrow(jokeId, em);
			const user = await this.userService.getUserOrThrow(username, em);
			let ratingEntity = await em.findOne(
				Rating, {
					where: {
						user: { username: user.username},
						joke: { id: jokeId }
					}
				}
			);
			if (ratingEntity == null) {
				ratingEntity = new Rating();
				ratingEntity.joke = joke;
				ratingEntity.user = user;
			}
			ratingEntity.score = rating;
			await this.invalidateCache(joke.tags.map(it => it.name));
			await em.save(ratingEntity);
		};
		return em ? f(em) : this.dataSource.transaction(f);
	}

	private async invalidatePopularCache() {
		const key = this.cacheService.createKeyBuilder()
			.addValue("popular")
			.buildSection();

		await Promise.all(
			this.INVALIDATIVE_PAGE_SIZES.map(
				pageSize => this.cacheService.invalidateValue(key, pageSize)
			)
		);
	}

	private async invalidateTagCache(tag: string) {
		const key = this.cacheService.createKeyBuilder()
			.addValue("tag")
			.buildSection();
		this.cacheService.invalidateValue(key, tag);
	}

	private async invalidateCache(tags: string[]) {
		await this.invalidatePopularCache();
		if (tags.length === 1) {
			await this.invalidateTagCache(tags[0]);
		}  
	}

	async comment(
		jokeId: number,
		text: string,
		signature: Signature,
		em?: EntityManager
	): Promise<Commentary> {
		const f = async (em: EntityManager) => {
			if (text.length > Commentary.MAX_LENGTH) {
				throw new PayloadTooLargeException("text");
			}
			const joke = await this.getJokeOrThrow(jokeId, em);
			const user = signature.username ? await this.userService.getUserOrThrow(signature.username, em) : null;
			const comment = new Commentary();
			comment.joke = joke;
			comment.text = text;
			comment.sign(signature, user);
			return await em.save(comment);
		};
		return em ? f(em) : this.dataSource.transaction(f);
	}

	async getComments(
		jokeId: number,
		pageSize: number,
		token: string | null,
		em?: EntityManager
	): Promise<PaginatedResponse<Commentary>> {
		const f = async (em: EntityManager) => {
			await this.getJokeOrThrow(jokeId, em);
			const query = em
				.createQueryBuilder(Commentary, 'commentary')
				.leftJoinAndSelect('commentary.author', 'author')
				.where('commentary.joke.id = :jokeId', { jokeId })
				.orderBy('commentary.id', 'DESC')
				.take(pageSize + 1);
			if (token != null) {
				const lastId = decodeToken(token);
				query.andWhere('commentary.id < :lastId', { lastId });
			}

			const comments = await query.getMany();

			let nextToken: string | null = null;
			if (comments.length > pageSize) {
				nextToken = encodeToken(comments[pageSize - 1].id);
				comments.pop();
			}

			return {
				token: nextToken,
				value: comments,
			};
		};
		return em ? f(em) : this.dataSource.transaction(f);
	}
}