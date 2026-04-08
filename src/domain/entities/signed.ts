import { Column, CreateDateColumn, Entity, ManyToOne, Repository } from "typeorm";
import { User } from "./user.entity";
import { Signature } from 'src/domain/signature';

export abstract class Signed {
    @ManyToOne(() => User, { nullable: true })
    author: User | null;

    @Column({ type: 'varchar', nullable: true })
    authorIPv4: string | null;

    @Column({ type: 'varchar', nullable: true })
    authorIPv6: string | null;

    @CreateDateColumn()
    createdAt: Date;

    sign(signature: Signature, author: User | null) {
        this.author = author;
        this.authorIPv4 = signature.authorIpv4;
        this.authorIPv6 = signature.authorIpv6;
    }
}