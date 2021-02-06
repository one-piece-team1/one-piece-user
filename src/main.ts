import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { config } from '../config';

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
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
  await app.listen(config.PORT);
  Logger.log(`Server start on ${config.HOST}:${config.PORT}`, 'Bootstrap', true);
}
bootstrap();
