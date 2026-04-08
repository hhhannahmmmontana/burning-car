import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresTypeOrmOptionsFactory } from './infrastructure/postgres.config';
import { UsersModule } from './modules/users.module';
import { JokesModule } from './modules/jokes.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { BffModule } from './modules/bff.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env'],
		}),
		CacheModule.registerAsync({
			isGlobal: true,
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				store: redisStore,
				host: configService.get('REDIS_HOST', 'localhost'),
				port: configService.get('REDIS_PORT', 6379),
				ttl: 60,
			}),
			inject: [ConfigService],
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useClass: PostgresTypeOrmOptionsFactory,
		}),
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
			sortSchema: true,
			playground: true,
		}),
		UsersModule,
		JokesModule,
		BffModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
