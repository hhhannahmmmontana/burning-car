import { BadRequestException, NotFoundException } from "@nestjs/common";
import { User } from "src/domain/entities/user.entity";
import { DataSource, EntityManager } from "typeorm";

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

    async findUserOrThrow(
        username: string | null,
        entityManager?: EntityManager
    ): Promise<User> {
        const f = async (entityManager: EntityManager) => {
            const user = await this.findUser(username, entityManager);
            if (user == null) {
                throw new BadRequestException();
            }
            return user;
        }
        return entityManager ? f(entityManager) : this.dataSource.transaction(f);
    }
}