import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@codi/database';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ContentCacheService } from '../content-cache/content-cache.service';
import { S3Service } from '../s3/s3.service';
import { deleteLessonAssets } from './delete-lesson-assets';

@Injectable()
export class AdminModulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentCache: ContentCacheService,
    private readonly s3: S3Service,
  ) {}

  async findByCourse(courseId: string) {
    return this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { lessons: true } } },
    });
  }

  async findOne(id: string) {
    const mod = await this.prisma.module.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { problems: true } } },
        },
      },
    });
    if (!mod) throw new NotFoundException('Module not found');
    return mod;
  }

  async create(dto: CreateModuleDto) {
    const module = await this.prisma.module.create({ data: dto });
    await this.contentCache.invalidateCourseTree([module.courseId]);
    return module;
  }

  async update(id: string, dto: UpdateModuleDto) {
    try {
      const existing = await this.prisma.module.findUnique({
        where: { id },
        select: { courseId: true },
      });
      if (!existing) throw new NotFoundException('Module not found');
      const module = await this.prisma.module.update({ where: { id }, data: dto });
      await this.contentCache.invalidateCourseTree([existing.courseId, module.courseId]);
      return module;
    } catch (error) {
      if (this.isRecordNotFound(error)) throw new NotFoundException('Module not found');
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const { courseId, lessons } = await this.prisma.$transaction(async (transaction) => {
        const module = await transaction.module.findUnique({
          where: { id },
          select: { courseId: true },
        });
        if (!module) throw new NotFoundException('Module not found');
        const lessonAssets = await transaction.lesson.findMany({
          where: { moduleId: id },
          select: { id: true, imageObjectKey: true, pdfObjectKey: true, videoObjectKey: true },
        });
        await transaction.lesson.deleteMany({ where: { moduleId: id } });
        await transaction.module.delete({ where: { id } });
        return { courseId: module.courseId, lessons: lessonAssets };
      });
      await this.contentCache.invalidateDeletedLessons(
        lessons.map((lesson) => lesson.id),
        courseId,
      );
      await deleteLessonAssets(this.s3, lessons);
      return { deleted: true };
    } catch (error) {
      if (this.isRecordNotFound(error)) throw new NotFoundException('Module not found');
      throw error;
    }
  }

  private isRecordNotFound(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
  }
}
