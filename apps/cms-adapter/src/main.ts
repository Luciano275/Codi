import { NestFactory } from '@nestjs/core';
import { CmsAdapterModule } from './cms-adapter.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from '@codi/database';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(CmsAdapterModule);
  const config = app.get(ConfigService);

  app.useGlobalFilters(new GlobalExceptionFilter());
  const port = config.get('cmsAdapterPort');
  await app.listen(port);
  console.log(`CMS Adapter running on port ${port}`);
}
bootstrap();
