import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  ADMIN_COURSES_CACHE_KEY,
  ContentCacheService,
} from '../content-cache/content-cache.service';

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

  private courseCacheKey(courseId: string) {
    return `admin:courses:${courseId}`;
  }
}
