import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { config } from '@codi/config';
import { PrismaModule } from '@codi/database';
import { CmsAdapterController } from './cms-adapter.controller';
import { CmsAdapterService } from './cms-adapter.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), '../../.env'),
      load: [() => config],
    }),
    HttpModule,
    PrismaModule,
  ],
  controllers: [CmsAdapterController],
  providers: [CmsAdapterService],
  exports: [CmsAdapterService],
})
export class CmsAdapterModule {}
