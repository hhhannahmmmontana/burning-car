import { Field, ObjectType } from "@nestjs/graphql";
import { JokeType } from "./joke.type";
import { PaginatedResponse } from 'src/domain/paginated-response';
import { UserJoke } from 'src/domain/entities/user-joke.entity';

@ObjectType()
export class PaginatedJokeType {
    @Field(() => [JokeType])
    value: JokeType[];

    @Field({ nullable: true })
    nextToken?: string;

    public static fromPaginatedJoke(
        entity: PaginatedResponse<UserJoke>
    ): PaginatedJokeType {
        return {
            nextToken: entity.token ?? undefined,
            value: entity.value.map(JokeType.fromUserJoke),
        };
    }
}