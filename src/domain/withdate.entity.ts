import { CreateDateColumn } from "typeorm";

export abstract class WithDate {
    @CreateDateColumn()
    createdAt: Date;
}