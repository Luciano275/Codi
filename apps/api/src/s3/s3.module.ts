import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3_CLIENT } from './s3.constants';
import { S3Service } from './s3.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const accessKeyId = config.get<string>('aws.accessKey');
        const secretAccessKey = config.get<string>('aws.secretKey');
        return new S3Client({
          region: config.getOrThrow<string>('aws.region'),
          endpoint: config.get<string>('aws.endpoint') || undefined,
          forcePathStyle: Boolean(config.get<string>('aws.endpoint')),
          ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
        });
      },
    },
    {
      provide: 'S3_BUCKET',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getOrThrow<string>('aws.bucket'),
    },
    {
      provide: 'S3_READ_EXPIRES_IN',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get<number>('aws.signedReadExpiresIn') ?? 86400,
    },
    S3Service,
  ],
  exports: [S3_CLIENT, S3Service],
})
export class S3Module {}
