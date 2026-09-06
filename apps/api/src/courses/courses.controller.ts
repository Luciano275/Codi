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

  @Get('islands/:slug/path')
  @UseGuards(JwtAuthGuard)
  async findIslandPath(@Param('slug') slug: string) {
    return this.courses.findIslandPath(slug);
  }

  @Get(':id/path')
  @UseGuards(JwtAuthGuard)
  async findCoursePath(@Param('id') id: string) {
    return this.courses.findCoursePath(id);
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
