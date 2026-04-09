import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "./user.entity";
import { Joke } from "./joke.entity";

@Entity()
@Unique(["user", "joke"])
export class Favourite {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Joke)
    joke: Joke;
}