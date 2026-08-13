import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { ContentCacheService } from './content-cache.service';

@Module({
  imports: [RedisModule],
  providers: [ContentCacheService],
  exports: [ContentCacheService],
})
export class ContentCacheModule {}
