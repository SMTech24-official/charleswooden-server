import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'euhan-nest',
      logLevels: ['error', 'warn', 'fatal'],
      timestamp: true,
      json: true,
    }),
    rawBody: true,
  });

  app.enableCors();
// testing jenkins
  // validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: false,
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.use(cookieParser());

  const configService = app.get(ConfigService);

  const port = configService.get<number>('port') || 5000;

  app.setGlobalPrefix('api/v1');

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}


bootstrap();
