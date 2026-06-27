import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get('frontendUrl'),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const port = config.get('apiPort') || 4000;
  await app.listen(port);
  console.log(`Codi API running on port ${port}`);
}
bootstrap();
