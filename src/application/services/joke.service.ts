import { ConflictException, Injectable, NotFoundException, PayloadTooLargeException } from "@nestjs/common";
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

@Injectable()
export class JokeService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly tagService: TagService,
		private readonly userService: UserService,
	) {}

	async createJoke(
        text: string,
        tags: string[],
        signature: Signature,
        entityManager?: EntityManager
    ): Promise<Joke> {
        const f = async (entityManager: EntityManager) => {
			let user: User | null = null;
			if (signature.username) {
				user = await this.userService.getUserOrThrow(signature.username, entityManager);
			}

            const joke = new Joke();
            joke.text = text;
            joke.tags = [];
            for (let tag of tags) {
                joke.tags.push(await this.tagService.findOrCreateTag(tag, user, signature, entityManager));
            }
            joke.sign(signature, user);
            const saved = await entityManager.save(joke);
            return saved;
        };
        return entityManager ? f(entityManager) : this.dataSource.transaction(f);
    }

	async getJokeOrThrow(
		jokeId: number,
		entityManager?: EntityManager
	): Promise<Joke> {
		const f = async (entityManager: EntityManager) => {
			const joke = await entityManager.findOne(
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
			const query = entityManager
				.createQueryBuilder(Joke, 'joke')
				.orderBy('joke.id', 'ASC')
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

			query.leftJoinAndSelect('joke.tags', 'tag')

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
        			)
					.orderBy('joke.rates_amount', 'DESC')
					.addOrderBy('joke.id', 'ASC');
			}

			query.leftJoinAndSelect('joke.author', 'author')

			const jokeIds = await query.getMany();

			if (jokeIds.length === 0) {
				return { token: null, value: [] };
			}

			const jokes = await query.getMany();

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

	async addToFavourites(
		jokeId: number,
		username: string,
		entityManager?: EntityManager
	) {
		const f = async (entityManager: EntityManager) => {
			const user = await this.userService.getUserOrThrow(username, entityManager);
			const existing = await entityManager.findOne(
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
				await entityManager.save(fav);
			} else {
				throw new ConflictException(`jokeId: ${jokeId}, username: ${username}`);
			}
		};
		return entityManager ? f(entityManager) : this.dataSource.transaction(f);
	}

	async removeFromFavourites(
		jokeId: number,
		username: string,
		entityManager?: EntityManager
	) {
		const f = async (entityManager: EntityManager) => {
			const user = await this.userService.getUserOrThrow(username, entityManager);
			const existing = await entityManager.findOne(
				Favourite, {
					where: {
						user: { username: user.username},
						joke: { id: jokeId }
					}
				}
			);
			if (existing != null) {
				await entityManager.remove(existing);
			}
		};
		return entityManager ? f(entityManager) : this.dataSource.transaction(f);
	}

	async rateJoke(
		jokeId: number,
		rating: number,
		username: string,
		entityManager?: EntityManager
	) {
		const f = async (entityManager: EntityManager) => {
			const joke = await this.getJokeOrThrow(jokeId, entityManager);
			const user = await this.userService.getUserOrThrow(username, entityManager);
			let ratingEntity = await entityManager.findOne(
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
			await entityManager.save(ratingEntity);
		};
		return entityManager ? f(entityManager) : this.dataSource.transaction(f);
	}

	async comment(
		jokeId: number,
		text: string,
		signature: Signature,
		entityManager?: EntityManager
	): Promise<Commentary> {
		const f = async (entityManager: EntityManager) => {
			if (text.length > Commentary.MAX_LENGTH) {
				throw new PayloadTooLargeException("text");
			}
			const joke = await this.getJokeOrThrow(jokeId, entityManager);
			const user = signature.username ? await this.userService.getUserOrThrow(signature.username, entityManager) : null;
			const comment = new Commentary();
			comment.joke = joke;
			comment.text = text;
			comment.sign(signature, user);
			return await entityManager.save(comment);
		};
		return entityManager ? f(entityManager) : this.dataSource.transaction(f);
	}

	async getComments(
		jokeId: number,
		pageSize: number,
		token: string | null,
		entityManager?: EntityManager
	): Promise<PaginatedResponse<Commentary>> {
		const f = async (entityManager: EntityManager) => {
			await this.getJokeOrThrow(jokeId, entityManager);
			const query = entityManager
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
		return entityManager ? f(entityManager) : this.dataSource.transaction(f);
	}
}