import { Entity, ManyToOne } from "typeorm";
import { User } from "./user.entity";
import { Joke } from "./joke.entity";

@Entity()
export class Favourite {
    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Joke)
    joke: Joke;
}