import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TagService } from "src/application/services/tags.service";
import { Tag } from "src/domain/entities/tag.entity";


@Module({
    imports: [TypeOrmModule.forFeature([Tag])],
    providers: [TagService],
    exports: [TagService]
})
export class TagsModule {}