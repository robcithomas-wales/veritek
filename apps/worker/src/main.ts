import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`Worker service running on port ${port}`, 'Bootstrap');
}

bootstrap();
