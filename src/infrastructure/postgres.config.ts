import { Injectable } from "@nestjs/common";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { User } from "src/domain/entities/user.entity";

@Injectable()
export class PostgresTypeOrmOptionsFactory implements TypeOrmOptionsFactory {
    constructor(private configService: ConfigService) {}

    createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
            type: 'postgres',
            host: this.configService.get<string>('POSTGRES_HOST'),
            port: this.configService.get<number>('POSTGRES_PORT'),
            username: this.configService.get<string>('POSTGRES_USER'),
            password: this.configService.get<string>('POSTGRES_PASSWORD'),
            database: this.configService.get<string>('POSTGRES_DB'),
            entities: [`${__dirname}/../domain/entities/*.entity.{ts,js}`],
            migrations: [`${__dirname}/migrations/*.{ts,js}`],
            synchronize: true,
            namingStrategy: new SnakeNamingStrategy(),
        }
    }
}