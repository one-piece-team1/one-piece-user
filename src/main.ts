import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { config } from '../config';
import { AMQPHandlerFactory } from './rabbitmq';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      skipMissingProperties: true,
      validationError: { target: true },
      transform: true,
    }),
  );
  app.enableCors({
    credentials: true,
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await app.listen(config.PORT);
  Logger.log(`Server start on ${config.HOST}:${config.PORT}`, 'Bootstrap', true);
}
bootstrap();
