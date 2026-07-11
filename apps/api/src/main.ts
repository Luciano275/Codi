import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { json, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { GlobalExceptionFilter } from '@codi/database';

async function bootstrap() {
  if (!process.env.NODE_ENV) {
    console.error('FATAL: NODE_ENV must be set (development/production)');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-in-production')) {
    console.error('FATAL: JWT_SECRET environment variable must be set to a strong, unique value in production');
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.disable('x-powered-by');
  app.use(json({ limit: '1mb' }));

  if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.headers['x-forwarded-proto'] !== 'https' && req.headers['x-forwarded-proto'] !== undefined) {
        res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
        return;
      }
      next();
    });
  }

  app.setGlobalPrefix('api');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'self'"],
      },
    },
  }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = config.get('apiPort') || 4000;
  await app.listen(port);
  console.log(`Codi API running on port ${port} (${process.env.NODE_ENV})`);
}
bootstrap();
