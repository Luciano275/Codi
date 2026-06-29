import { Module } from '@nestjs/common';
import { AdminLessonsController } from './admin-lessons.controller';
import { AdminLessonsService } from './admin-lessons.service';
import { AdminProblemsController } from './admin-problems.controller';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminCoursesService } from './admin-courses.service';
import { AdminModulesController } from './admin-modules.controller';
import { AdminModulesService } from './admin-modules.service';

@Module({
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
