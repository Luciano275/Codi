import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { config } from '@codi/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), '../../.env'),
      load: [() => config]
    }),
    HttpModule
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class CmsAdapterModule {}
