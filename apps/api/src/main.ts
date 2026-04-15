import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  });

  const port = process.env.PORT ?? 4000;
  const logger = new Logger('Bootstrap');

  app.getHttpAdapter().get('/health', (_req: unknown, res: { send: (s: string) => void }) => res.send('ok'));

  await app.listen(port, '0.0.0.0');
  logger.log(`API running on http://localhost:${port} [${process.env.NODE_ENV ?? 'development'}]`);
}

bootstrap();
