import { NestFactory } from '@nestjs/core';
import { CmsAdapterModule } from './cms-adapter.module';

async function bootstrap() {
  const app = await NestFactory.create(CmsAdapterModule);
  const port = process.env.CMS_ADAPTER_PORT || 4001;
  await app.listen(port);
  console.log(`CMS Adapter running on port ${port}`);
}
bootstrap();
