import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { tmpdir } from 'os';
import { S3Module } from '../s3/s3.module';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    S3Module,
    MulterModule.register({
      dest: tmpdir(),
      limits: { fileSize: 500 * 1024 * 1024, files: 1 },
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
