import { Module } from '@nestjs/common';
import { AdminLessonsController } from './admin-lessons.controller';
import { AdminLessonsService } from './admin-lessons.service';
import { AdminProblemsController } from './admin-problems.controller';

@Module({
  controllers: [AdminLessonsController, AdminProblemsController],
  providers: [AdminLessonsService],
})
export class AdminModule {}
