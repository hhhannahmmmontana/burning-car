import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JokeService } from "src/application/services/joke.service";
import { Joke } from "src/domain/entities/joke.entity";
import { JokesController } from "src/presentation/controllers/jokes.controller";
import { TagsModule } from "./tags.module";
import { UsersModule } from "./users.module";
import { JokesResolver } from "src/presentation/graphql/jokes.resolver";

@Module({
    imports: [
        TypeOrmModule.forFeature([Joke]),
        TagsModule,
        UsersModule
    ],
    providers: [JokeService, JokesResolver],
    controllers: [JokesController],
    exports: [JokeService]
})
export class JokesModule {}