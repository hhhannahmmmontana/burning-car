import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresTypeOrmOptionsFactory } from './infrastructure/postgres.config';

@Module({
	imports: [
	ConfigModule.forRoot({
		isGlobal: true,
		envFilePath: ['.env'],
	}),
	TypeOrmModule.forRootAsync({
		imports: [ConfigModule],
		useClass: PostgresTypeOrmOptionsFactory,
	}),
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
