import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresTypeOrmOptionsFactory } from './infrastructure/postgres.config';
import { UsersModule } from './modules/users.module';
import { JokesModule } from './modules/jokes.module';

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
		UsersModule,
		JokesModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
