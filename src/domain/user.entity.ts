import { Column, Entity, PrimaryColumn } from "typeorm";
import { WithDate } from "./withdate.entity";

@Entity()
export class User extends WithDate {
    @PrimaryColumn()
    username: string;

    @Column()
    passwordHash: string;
}