import { Injectable } from "@nestjs/common";
import { Tag } from "src/domain/entities/tag.entity";
import { User } from "src/domain/entities/user.entity";
import { Signature } from "src/domain/signature";
import { DataSource, EntityManager } from "typeorm";

@Injectable()
export class TagService {
    constructor(
        private dataSource: DataSource
    ) {}

    async findOrCreateTag(
        name: string,
        user: User | null,
        signature: Signature,
        entityManager?: EntityManager
    ): Promise<Tag> {
        const f = async (entityManager: EntityManager) => {
            let tagEntity = await entityManager.findOne(Tag, { where: { name: name } });
            if (tagEntity == null) {
                tagEntity = new Tag();
                tagEntity.name = name;
                tagEntity.sign(signature, user);
                tagEntity = await entityManager.save(tagEntity);
            }
            return tagEntity;
        };
        return entityManager ? f(entityManager) : this.dataSource.transaction(f);
    }

    async filterExistingTags(
        tags: string[],
        entityManager?: EntityManager
    ): Promise<string[]> {
        const f = async (entityManager: EntityManager) => {
            const ans: string[] = [];
            for (const tag of tags) {
                if (await entityManager.exists(Tag, { where: { name: tag } })) {
                    ans.push(tag);
                }
            }
            return ans;
        };
        return entityManager ? f(entityManager) : this.dataSource.transaction(f);
    }
}