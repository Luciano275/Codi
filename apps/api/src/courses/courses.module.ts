import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { RedisModule } from '../redis/redis.module';
import { S3Module } from '../s3/s3.module';
import { ContentCacheModule } from '../content-cache/content-cache.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [RedisModule, S3Module, ContentCacheModule, RewardsModule],
  controllers: [CoursesController, LessonsController],
  providers: [CoursesService, LessonsService],
})
export class CoursesModule {}
