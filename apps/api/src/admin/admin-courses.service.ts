import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@codi/database';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  ADMIN_COURSES_CACHE_KEY,
  ContentCacheService,
} from '../content-cache/content-cache.service';
import { createSlug } from './slug-generator';

@Injectable()
export class AdminCoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentCache: ContentCacheService,
  ) {}

  async findAll() {
    const cachedCourses = await this.contentCache.get<unknown[]>(ADMIN_COURSES_CACHE_KEY);
    if (cachedCourses) return cachedCourses;

    const courses = await this.prisma.course.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { modules: true } } },
    });
    await this.contentCache.set(ADMIN_COURSES_CACHE_KEY, courses);
    return courses;
  }

  async findOne(id: string) {
    const cacheKey = this.courseCacheKey(id);
    const cachedCourse = await this.contentCache.get<unknown>(cacheKey);
    if (cachedCourse) return cachedCourse;

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
    await this.contentCache.set(cacheKey, course);
    return course;
  }

  async create(dto: CreateCourseDto) {
    const course = await this.createWithUniqueSlug(dto);
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

  private courseCacheKey(courseId: string) {
    return `admin:courses:${courseId}`;
  }

  private async createWithUniqueSlug(dto: CreateCourseDto) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const slug = await this.createUniqueSlug(dto.title);

      try {
        return await this.prisma.course.create({ data: { ...dto, slug } });
      } catch (error) {
        if (!this.isUniqueConstraintError(error)) throw error;
      }
    }

    throw new ConflictException('No se pudo generar un slug único para el módulo');
  }

  private async createUniqueSlug(title: string) {
    const baseSlug = createSlug(title);
    let suffix = 1;
    let candidate = baseSlug;

    while (
      await this.prisma.course.findUnique({ where: { slug: candidate }, select: { id: true } })
    ) {
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }

    return candidate;
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
