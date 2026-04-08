import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryColumn()
    username: string;

    @Column()
    passwordHash: string;

    @CreateDateColumn()
    createdAt: Date;
}