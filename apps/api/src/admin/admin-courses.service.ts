import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@codi/database';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  ADMIN_COURSES_CACHE_KEY,
  ContentCacheService,
} from '../content-cache/content-cache.service';
import { createSlug } from './slug-generator';
import { S3Service } from '../s3/s3.service';
import { deleteLessonAssets } from './delete-lesson-assets';

@Injectable()
export class AdminCoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentCache: ContentCacheService,
    private readonly s3: S3Service,
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
    } catch (error) {
      if (this.isRecordNotFound(error)) throw new NotFoundException('Course not found');
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const lessons = await this.prisma.$transaction(async (transaction) => {
        const lessonAssets = await transaction.lesson.findMany({
          where: { module: { courseId: id } },
          select: { id: true, imageObjectKey: true, pdfObjectKey: true, videoObjectKey: true },
        });
        await transaction.lesson.deleteMany({ where: { module: { courseId: id } } });
        await transaction.module.deleteMany({ where: { courseId: id } });
        await transaction.course.delete({ where: { id } });
        return lessonAssets;
      });
      await this.contentCache.invalidateDeletedLessons(
        lessons.map((lesson) => lesson.id),
        id,
      );
      await deleteLessonAssets(this.s3, lessons);
      return { deleted: true };
    } catch (error) {
      if (this.isRecordNotFound(error)) throw new NotFoundException('Course not found');
      throw error;
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

  private isRecordNotFound(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
  }
}
