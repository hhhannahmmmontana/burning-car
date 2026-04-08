import { Entity, PrimaryColumn } from "typeorm";
import { Signed } from "./signed";

@Entity()
export class Tag extends Signed {
    @PrimaryColumn()
    name: string;
}