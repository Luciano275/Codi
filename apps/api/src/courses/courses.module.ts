import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { LessonsController } from './lessons.controller';

@Module({
  controllers: [CoursesController, LessonsController],
  providers: [CoursesService],
})
export class CoursesModule {}
