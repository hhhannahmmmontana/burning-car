import { Entity, PrimaryColumn } from "typeorm";
import { Signed } from "./signed.entity";

@Entity()
export class Category extends Signed {
    @PrimaryColumn()
    name: string;
}