import { Module } from '@nestjs/common';
import { AdminLessonsController } from './admin-lessons.controller';
import { AdminLessonsService } from './admin-lessons.service';
import { AdminProblemsController } from './admin-problems.controller';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminCoursesService } from './admin-courses.service';
import { AdminModulesController } from './admin-modules.controller';
import { AdminModulesService } from './admin-modules.service';
import { S3Module } from '../s3/s3.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [S3Module, RedisModule],
  controllers: [
    AdminLessonsController,
    AdminProblemsController,
    AdminCoursesController,
    AdminModulesController,
  ],
  providers: [
    AdminLessonsService,
    AdminCoursesService,
    AdminModulesService,
  ],
})
export class AdminModule {}
