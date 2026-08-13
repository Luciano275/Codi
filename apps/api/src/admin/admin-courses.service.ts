import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ContentCacheService } from '../content-cache/content-cache.service';

@Injectable()
export class AdminCoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentCache: ContentCacheService,
  ) {}

  async findAll() {
    return this.prisma.course.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { modules: true } } },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { lessons: true } } },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async create(dto: CreateCourseDto) {
    const course = await this.prisma.course.create({ data: dto });
    await this.contentCache.invalidateCourseTree([course.id]);
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    try {
      const course = await this.prisma.course.update({ where: { id }, data: dto });
      await this.contentCache.invalidateCourseTree([course.id]);
      return course;
    } catch {
      throw new NotFoundException('Course not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.course.delete({ where: { id } });
      await this.contentCache.invalidateCourseTree([id]);
    } catch {
      throw new NotFoundException('Course not found');
    }
  }
}
