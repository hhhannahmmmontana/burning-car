import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
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
	logger.log(`Server is running on port ${port}`);

	const config = new DocumentBuilder()
        .setTitle('Jokes API')
        .setDescription('API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

	const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document); 

	await app.listen(port);
}
bootstrap();
