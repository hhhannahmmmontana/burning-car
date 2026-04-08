import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Signed } from "./signed";
import { Tag } from "./tag.entity";

@Entity()
export class Joke extends Signed {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @ManyToMany(() => Tag)
    @JoinTable()
    tags: Tag[];

    @Column()
    rating: number;

    @Column()
    ratesAmount: number;
}