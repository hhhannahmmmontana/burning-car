import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JokeService } from "src/application/services/joke.service";
import { Joke } from "src/domain/entities/joke.entity";
import { JokesController } from "src/presentation/controllers/jokes.controller";
import { TagsModule } from "./tags.module";
import { UsersModule } from "./users.module";
import { JokesResolver } from "src/presentation/graphql/jokes.resolver";
import { BffController } from "src/presentation/controllers/bff.controller";
import { CacheService } from "src/application/services/cache.service";
import { PaginatedResponse } from "src/domain/paginated-response";
import { UserJoke } from "src/domain/entities/user-joke.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Joke]),
        TagsModule,
        UsersModule,
    ],
    providers: [
        JokeService,
        JokesResolver,
        CacheService<PaginatedResponse<UserJoke>>
    ],
    controllers: [JokesController, BffController],
    exports: [JokeService]
})
export class JokesModule {}