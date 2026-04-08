import { Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";

export abstract class Signed {
    @ManyToOne(() => User, { nullable: true })
    author: User;

    @Column({ nullable: true })
    authorIPv4: string;

    @Column({ nullable: true })
    authorIPv6: string;

    @CreateDateColumn()
    createdAt: Date;
}