import { Controller, Get, Post, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoursesService } from './courses.service';
import type { User } from '@codi/database';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, order: true, type: true },
            },
          },
        },
        problems: {
          select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true },
        },
      },
    });

    if (!lesson) throw new NotFoundException('Lesson not found');

    const problemIds = lesson.problems.map((p) => p.id);
    const solved = await this.prisma.submission.findMany({
      where: { userId: user.id, problemId: { in: problemIds }, status: 'ACCEPTED' },
      select: { problemId: true },
      distinct: ['problemId'],
    });
    const solvedProblemIds = solved.map((s) => s.problemId);

    return { ...lesson, solvedProblemIds };
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  async complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.coursesService.completeLesson(user.id, id);
  }

  @Post(':id/uncomplete')
  @UseGuards(JwtAuthGuard)
  async uncomplete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.coursesService.uncompleteLesson(user.id, id);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async status(@CurrentUser() user: User, @Param('id') id: string) {
    return this.coursesService.getLessonStatus(user.id, id);
  }
}
