import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresTypeOrmOptionsFactory } from './infrastructure/postgres.config';
import { UsersModule } from './modules/users.module';
import { JokesModule } from './modules/jokes.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

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
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			graphiql: true,
			autoSchemaFile: join(process.cwd(), 'src/schema.gql')
		}),
		UsersModule,
		JokesModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
