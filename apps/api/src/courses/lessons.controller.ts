import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoursesService } from './courses.service';
import { LessonsService } from './lessons.service';
import type { User } from '@codi/database';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly lessonsService: LessonsService,
  ) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.lessonsService.findOne(user.id, id);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.coursesService.completeLesson(user.id, id);
  }

  @Post(':id/uncomplete')
  @UseGuards(JwtAuthGuard)
  uncomplete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.coursesService.uncompleteLesson(user.id, id);
  }

  @Post(':id/smart-hint/unlock')
  @UseGuards(JwtAuthGuard)
  unlockSmartHint(@CurrentUser() user: User, @Param('id') id: string) {
    return this.lessonsService.unlockSmartHint(user.id, id);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: User, @Param('id') id: string) {
    return this.coursesService.getLessonStatus(user.id, id);
  }
}
