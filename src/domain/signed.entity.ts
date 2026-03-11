import { Column, ManyToOne } from "typeorm";
import { User } from "./user.entity";
import { WithDate } from "./withdate.entity";

export abstract class Signed extends WithDate {
    @ManyToOne(() => User, { nullable: true })
    author: User;

    @Column({ nullable: true })
    authorIPv4: string;

    @Column({ nullable: true })
    authorIPv6: string;
}