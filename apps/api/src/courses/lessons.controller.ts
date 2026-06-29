import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
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
    return lesson;
  }
}
