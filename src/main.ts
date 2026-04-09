import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: [
			'http://localhost:4200',
			'http://localhost:3000',
			'http://localhost:6767',
			'http://localhost',
			'http://bc-front'
		],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	});
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true,
		transformOptions: {
			enableImplicitConversion: false,
		},
	}));
	const logger = new Logger('NestApplication');
	const port = process.env.SERVICE_PORT ?? 3000;
	logger.log(`Server will be running on port ${port}`);

	const config = new DocumentBuilder()
        .setTitle('Jokes API')
        .setDescription('API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

	const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document); 
	logger.log("Swagger doc created on /api");

	const dataSource = app.get(DataSource);
	logger.log("Synchronizing entities");
	await dataSource.synchronize();
	console.log('Entities found:', dataSource.entityMetadatas.map(e => e.tableName));
	logger.log("Running migrations");
    await dataSource.runMigrations();

	await app.listen(port);
}
bootstrap();
