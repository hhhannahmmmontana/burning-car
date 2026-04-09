import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
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
        password: string,
        entityManager?: EntityManager
    ) {
        const f = async (entityManager: EntityManager) => {
            if (username.length < 3) {
                throw new BadRequestException("Too short username");
            }
            if (password.length < 8) {
                throw new BadRequestException("Too short password");
            }
            if (await entityManager.exists(User, { where: { username: username } })) {
                throw new ConflictException(`username: ${username}`);
            }
            const user = new User();
            user.username = username;
            user.passwordHash = await bcrypt.hash(password, 10); 
            return entityManager.save(user);
        };
        return entityManager ? f(entityManager) : this.dataSource.transaction(f);
    }
}