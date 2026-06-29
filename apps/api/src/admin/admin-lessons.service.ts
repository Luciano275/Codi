import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class AdminLessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.lesson.findMany({
      orderBy: [{ moduleId: 'asc' }, { order: 'asc' }],
      include: {
        module: {
          include: { course: { select: { id: true, title: true } } },
        },
        problems: {
          select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: { course: { select: { id: true, title: true } } },
        },
        problems: {
          select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true },
        },
      },
    });

    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async create(dto: CreateLessonDto) {
    const { problemIds, ...data } = dto;

    const lesson = await this.prisma.lesson.create({
      data: {
        ...data,
        content: (data.content as any) ?? {},
        problems: problemIds?.length
          ? { connect: problemIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        module: { include: { course: { select: { id: true, title: true } } } },
        problems: { select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true } },
      },
    });

    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lesson not found');

    const { problemIds, ...data } = dto;

    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: {
        ...data,
        content: data.content as any,
        problems: problemIds
          ? { set: problemIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        module: { include: { course: { select: { id: true, title: true } } } },
        problems: { select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true } },
      },
    });

    return lesson;
  }

  async remove(id: string) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lesson not found');

    await this.prisma.lesson.delete({ where: { id } });
    return { deleted: true };
  }
}
