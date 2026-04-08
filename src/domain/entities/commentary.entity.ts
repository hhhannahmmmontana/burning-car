import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Signed } from "./signed";
import { Joke } from "./joke.entity";

@Entity()
export class Commentary extends Signed {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Joke)
    joke: Joke;

    @Column()
    text: string
}