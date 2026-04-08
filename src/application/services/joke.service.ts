import { Injectable, NotFoundException } from "@nestjs/common";
import { Joke } from "src/domain/entities/joke.entity";
import { Signature } from "src/domain/signature";
import { DataSource, EntityManager } from "typeorm";
import { TagService } from "./tags.service";
import { UserService } from "./user.service";
import { Favourite } from "src/domain/entities/favourite.entity";
import { PaginatedResponse } from "src/domain/paginated-response";
import { decodeToken, encodeToken } from "../pagination";

@Injectable()
export class JokeService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly tagService: TagService,
		private readonly userService: UserService
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
			return entityManager.save(joke);
		};
		return entityManager ? f(entityManager) : this.dataSource.transaction(f);
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
			const filteredTags = await this.tagService.filterNonExistingTags(tags, entityManager);
			const lastId = decodeToken(token);
			const query = entityManager.createQueryBuilder(Joke, 'joke')
				.leftJoinAndSelect('joke.tags', 'tag')
				.orderBy('joke.id', 'ASC')
				.take(pageSize + 1);

			if (lastId !== null) {
				query.where('joke.id > :lastId', { lastId });
			}

			if (isFavourites && user != null) {
				const username = user.username;
				query.innerJoin(
					Favourite,
					'favourite',
					'favourite.jokeId = joke.id AND favourite.userUsername = :username',
					{ username }
				);
			}

			if (filteredTags.length > 0) {
				query.andWhere('tag.name IN (:...tags)', { tags: filteredTags });
			}

			if (search) {
				query
					.andWhere('joke.text LIKE :search', { search: `%${search}%` })
					.orderBy('joke.ratesAmount', 'DESC')
					.addOrderBy('joke.id', 'ASC'); 
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