import { Column, CreateDateColumn, ManyToOne, Repository } from "typeorm";
import { User } from "./user.entity";
import { Signature } from 'src/domain/signature';

export abstract class Signed {
    @ManyToOne(() => User, { nullable: true })
    author: User | null;

    @Column({ nullable: true })
    authorIPv4: string | null;

    @Column({ nullable: true })
    authorIPv6: string | null;

    @CreateDateColumn()
    createdAt: Date;

    sign(signature: Signature, author: User | null) {
        this.author = author;
        this.authorIPv4 = signature.authorIpv4;
        this.authorIPv6 = signature.authorIpv6;
    }
}