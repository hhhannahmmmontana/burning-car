import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { User } from "src/domain/entities/user.entity";
import { DataSource, EntityManager } from "typeorm";

@Injectable()
export class UserService {
    constructor(
        private dataSource: DataSource
    ) {}

    async findUser(
        username: string | null,
        entityManager?: EntityManager
    ): Promise<User | null> {
        if (username == null) return null;
        const f = async (entityManager: EntityManager) => 
            await entityManager.findOne(User, { where: { username: username } });

        return entityManager ? f(entityManager) : this.dataSource.transaction(f);
    }

    async getUserOrThrow(
        username: string | null,
        entityManager?: EntityManager
    ): Promise<User> {
        const f = async (entityManager: EntityManager) => {
            const user = await this.findUser(username, entityManager);
            if (user == null) {
                throw new NotFoundException(`username: ${username}`);
            }
            return user;
        }
        return entityManager ? f(entityManager) : this.dataSource.transaction(f);
    }

    async createUser(
        username: string,
        hashedPassword: string,
        em?: EntityManager
    ) {
        const f = async (em: EntityManager) => {
            if (await em.exists(User, { where: { username: username } })) {
                throw new ConflictException(`User ${username} already exists`);
            }
            const user = new User();
            user.username = username;
            user.passwordHash = hashedPassword;
            return em.save(user);
        }
        return em ? f(em) : this.dataSource.transaction(f);
    }
}