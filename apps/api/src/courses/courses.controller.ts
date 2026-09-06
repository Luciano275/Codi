import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@codi/database';

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.courses.findAll();
  }

  @Get('islands')
  @UseGuards(JwtAuthGuard)
  async findIslands() {
    return this.courses.findIslands();
  }

  @Get('progress/me')
  @UseGuards(JwtAuthGuard)
  async myProgress(@CurrentUser() user: User) {
    return this.courses.getProgress(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.courses.findOne(id);
  }
}
