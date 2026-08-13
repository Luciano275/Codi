import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { randomUUID } from 'crypto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { S3Service } from '../s3/s3.service';
import { RedisService } from '../redis/redis.service';
import type { RedisClientType } from 'redis';

@Injectable()
export class AdminLessonsService {
  private readonly redis: RedisClientType;

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    redisService: RedisService,
  ) {
    this.redis = redisService.getClient();
  }

  async findAll() {
    const lessons = await this.prisma.lesson.findMany({
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
    return Promise.all(lessons.map((lesson) => this.serializeLesson(lesson)));
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
    return this.serializeLesson(lesson);
  }

  async create(userId: string, dto: CreateLessonDto) {
    const { problemIds, pdfUploadKey, videoUploadKey, removePdf, removeVideo, ...data } = dto;
    if (removePdf || removeVideo) throw new BadRequestException('No se puede eliminar un recurso al crear');
    const lessonId = randomUUID();
    let pdf: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;
    let video: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;

    try {
      if (pdfUploadKey) pdf = await this.s3.promotePendingObject(userId, 'lesson-pdf', pdfUploadKey, lessonId);
      if (videoUploadKey) video = await this.s3.promotePendingObject(userId, 'lesson-video', videoUploadKey, lessonId);
      const lesson = await this.prisma.lesson.create({
        data: {
          id: lessonId,
          ...data,
          content: (data.content as object | undefined) ?? {},
          ...(pdf ? { pdfObjectKey: pdf.objectKey, pdfFileName: pdf.fileName } : {}),
          ...(video ? {
            videoObjectKey: video.objectKey,
            videoFileName: video.fileName,
            videoContentType: video.contentType,
          } : {}),
          problems: problemIds?.length ? { connect: problemIds.map((id) => ({ id })) } : undefined,
        },
        include: {
          module: { include: { course: { select: { id: true, title: true } } } },
          problems: { select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true } },
        },
      });
      await this.invalidateLessonCache(lesson.id);
      return this.serializeLesson(lesson);
    } catch (error) {
      await Promise.all([this.s3.deleteObject(pdf?.objectKey), this.s3.deleteObject(video?.objectKey)]);
      throw error;
    }
  }

  async update(userId: string, id: string, dto: UpdateLessonDto) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lesson not found');

    const { problemIds, pdfUploadKey, videoUploadKey, removePdf, removeVideo, ...data } = dto;
    if ((pdfUploadKey && removePdf) || (videoUploadKey && removeVideo)) {
      throw new BadRequestException('No se puede reemplazar y eliminar el mismo recurso');
    }
    let pdf: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;
    let video: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;
    try {
      if (pdfUploadKey) pdf = await this.s3.promotePendingObject(userId, 'lesson-pdf', pdfUploadKey, id);
      if (videoUploadKey) video = await this.s3.promotePendingObject(userId, 'lesson-video', videoUploadKey, id);
      const lesson = await this.prisma.lesson.update({
        where: { id },
        data: {
          ...data,
          ...(data.content !== undefined ? { content: data.content as object } : {}),
          ...(pdf || removePdf ? { pdfObjectKey: pdf?.objectKey ?? null, pdfFileName: pdf?.fileName ?? null } : {}),
          ...(video || removeVideo ? {
            videoObjectKey: video?.objectKey ?? null,
            videoFileName: video?.fileName ?? null,
            videoContentType: video?.contentType ?? null,
          } : {}),
          problems: problemIds ? { set: problemIds.map((problemId) => ({ id: problemId })) } : undefined,
        },
        include: {
          module: { include: { course: { select: { id: true, title: true } } } },
          problems: { select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true } },
        },
      });
      await Promise.all([
        pdf || removePdf ? this.s3.deleteObject(existing.pdfObjectKey) : undefined,
        video || removeVideo ? this.s3.deleteObject(existing.videoObjectKey) : undefined,
      ]);
      await this.invalidateLessonCache(id);
      return this.serializeLesson(lesson);
    } catch (error) {
      await Promise.all([this.s3.deleteObject(pdf?.objectKey), this.s3.deleteObject(video?.objectKey)]);
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lesson not found');

    await this.prisma.lesson.delete({ where: { id } });
    await Promise.all([this.s3.deleteObject(existing.pdfObjectKey), this.s3.deleteObject(existing.videoObjectKey)]);
    await this.invalidateLessonCache(id);
    return { deleted: true };
  }

  private async invalidateLessonCache(lessonId: string) {
    await this.redis.del(`lessons:${lessonId}`);
  }

  private async serializeLesson<T extends {
    pdfObjectKey: string | null;
    pdfFileName: string | null;
    videoObjectKey: string | null;
    videoFileName: string | null;
    videoContentType: string | null;
  }>(lesson: T) {
    const [pdf, video] = await Promise.all([
      this.s3.signedResource(lesson.pdfObjectKey, lesson.pdfFileName, 'application/pdf'),
      this.s3.signedResource(lesson.videoObjectKey, lesson.videoFileName, lesson.videoContentType),
    ]);
    return { ...lesson, resources: { pdf, video } };
  }
}
