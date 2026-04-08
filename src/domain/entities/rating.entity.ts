import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "./user.entity";
import { Joke } from "./joke.entity";

@Entity()
@Unique(["user", "joke"])
export class Rating {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "float" })
    score: number;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Joke)
    joke: Joke;
}