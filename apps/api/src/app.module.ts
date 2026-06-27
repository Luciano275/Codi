import { Module } from '@nestjs/common';
import { PrismaModule } from '@codi/database';
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
    PrismaModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
