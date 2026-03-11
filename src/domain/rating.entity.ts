import { Column, Entity, ManyToOne, Unique } from "typeorm";
import { WithDate } from "./withdate.entity";
import { User } from "./user.entity";
import { Joke } from "./joke.entity";

@Entity()
@Unique(["user", "joke"])
export class Rating extends WithDate {
    @Column({ type: "float" })
    score: number;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Joke)
    joke: Joke;
}