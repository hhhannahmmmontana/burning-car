import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('NestApplication');
  const port = process.env.SERVICE_PORT ?? 3000;
  await app.listen(port);
  logger.log(`Server is running on port ${port}`)
}
bootstrap();
