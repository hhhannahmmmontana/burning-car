import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Signed } from "./signed.entity";

@Entity()
export class Joke extends Signed {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @Column()
    tags: string[];

    @Column()
    rating: number;

    @Column()
    ratesAmount: number;
}