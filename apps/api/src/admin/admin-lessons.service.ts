import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { randomUUID } from 'crypto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { S3Service } from '../s3/s3.service';
import {
  ADMIN_LESSONS_CACHE_KEY,
  ContentCacheService,
} from '../content-cache/content-cache.service';

@Injectable()
export class AdminLessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly contentCache: ContentCacheService,
  ) {}

  async findAll() {
    const cachedLessons = await this.contentCache.get<unknown[]>(ADMIN_LESSONS_CACHE_KEY);
    if (cachedLessons) return cachedLessons;

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
    const serializedLessons = await Promise.all(
      lessons.map((lesson) => this.serializeLesson(lesson)),
    );
    await this.contentCache.set(ADMIN_LESSONS_CACHE_KEY, serializedLessons);
    return serializedLessons;
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
    const {
      problemIds,
      imageUploadKey,
      pdfUploadKey,
      videoUploadKey,
      removeImage,
      removePdf,
      removeVideo,
      ...data
    } = dto;
    if (removeImage || removePdf || removeVideo)
      throw new BadRequestException('No se puede eliminar un recurso al crear');
    const lessonId = randomUUID();
    let image: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;
    let pdf: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;
    let video: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;

    try {
      if (imageUploadKey)
        image = await this.s3.promotePendingObject(
          userId,
          'lesson-image',
          imageUploadKey,
          lessonId,
        );
      if (pdfUploadKey)
        pdf = await this.s3.promotePendingObject(userId, 'lesson-pdf', pdfUploadKey, lessonId);
      if (videoUploadKey)
        video = await this.s3.promotePendingObject(
          userId,
          'lesson-video',
          videoUploadKey,
          lessonId,
        );
      const lesson = await this.prisma.lesson.create({
        data: {
          id: lessonId,
          ...data,
          content: (data.content as object | undefined) ?? {},
          ...(image
            ? {
                imageObjectKey: image.objectKey,
                imageFileName: image.fileName,
                imageContentType: image.contentType,
              }
            : {}),
          ...(pdf ? { pdfObjectKey: pdf.objectKey, pdfFileName: pdf.fileName } : {}),
          ...(video
            ? {
                videoObjectKey: video.objectKey,
                videoFileName: video.fileName,
                videoContentType: video.contentType,
              }
            : {}),
          problems: problemIds?.length ? { connect: problemIds.map((id) => ({ id })) } : undefined,
        },
        include: {
          module: { include: { course: { select: { id: true, title: true } } } },
          problems: {
            select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true },
          },
        },
      });
      await this.contentCache.invalidateLesson(lesson.id, [lesson.module.course.id]);
      return this.serializeLesson(lesson);
    } catch (error) {
      await Promise.all([
        this.s3.deleteObject(image?.objectKey),
        this.s3.deleteObject(pdf?.objectKey),
        this.s3.deleteObject(video?.objectKey),
      ]);
      throw error;
    }
  }

  async update(userId: string, id: string, dto: UpdateLessonDto) {
    const existing = await this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { select: { courseId: true } } },
    });
    if (!existing) throw new NotFoundException('Lesson not found');

    const {
      problemIds,
      imageUploadKey,
      pdfUploadKey,
      videoUploadKey,
      removeImage,
      removePdf,
      removeVideo,
      ...data
    } = dto;
    if (
      (imageUploadKey && removeImage) ||
      (pdfUploadKey && removePdf) ||
      (videoUploadKey && removeVideo)
    ) {
      throw new BadRequestException('No se puede reemplazar y eliminar el mismo recurso');
    }
    let image: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;
    let pdf: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;
    let video: Awaited<ReturnType<S3Service['promotePendingObject']>> | undefined;
    try {
      if (imageUploadKey)
        image = await this.s3.promotePendingObject(userId, 'lesson-image', imageUploadKey, id);
      if (pdfUploadKey)
        pdf = await this.s3.promotePendingObject(userId, 'lesson-pdf', pdfUploadKey, id);
      if (videoUploadKey)
        video = await this.s3.promotePendingObject(userId, 'lesson-video', videoUploadKey, id);
      const lesson = await this.prisma.lesson.update({
        where: { id },
        data: {
          ...data,
          ...(data.content !== undefined ? { content: data.content as object } : {}),
          ...(image || removeImage
            ? {
                imageObjectKey: image?.objectKey ?? null,
                imageFileName: image?.fileName ?? null,
                imageContentType: image?.contentType ?? null,
              }
            : {}),
          ...(pdf || removePdf
            ? { pdfObjectKey: pdf?.objectKey ?? null, pdfFileName: pdf?.fileName ?? null }
            : {}),
          ...(video || removeVideo
            ? {
                videoObjectKey: video?.objectKey ?? null,
                videoFileName: video?.fileName ?? null,
                videoContentType: video?.contentType ?? null,
              }
            : {}),
          problems: problemIds
            ? { set: problemIds.map((problemId) => ({ id: problemId })) }
            : undefined,
        },
        include: {
          module: { include: { course: { select: { id: true, title: true } } } },
          problems: {
            select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true },
          },
        },
      });
      await Promise.all([
        image || removeImage ? this.s3.deleteObject(existing.imageObjectKey) : undefined,
        pdf || removePdf ? this.s3.deleteObject(existing.pdfObjectKey) : undefined,
        video || removeVideo ? this.s3.deleteObject(existing.videoObjectKey) : undefined,
      ]);
      await this.contentCache.invalidateLesson(id, [
        existing.module.courseId,
        lesson.module.course.id,
      ]);
      return this.serializeLesson(lesson);
    } catch (error) {
      await Promise.all([
        this.s3.deleteObject(image?.objectKey),
        this.s3.deleteObject(pdf?.objectKey),
        this.s3.deleteObject(video?.objectKey),
      ]);
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { select: { courseId: true } } },
    });
    if (!existing) throw new NotFoundException('Lesson not found');

    await this.prisma.lesson.delete({ where: { id } });
    await Promise.all([
      this.s3.deleteObject(existing.imageObjectKey),
      this.s3.deleteObject(existing.pdfObjectKey),
      this.s3.deleteObject(existing.videoObjectKey),
    ]);
    await this.contentCache.invalidateLesson(id, [existing.module.courseId]);
    return { deleted: true };
  }

  private async serializeLesson<
    T extends {
      imageObjectKey: string | null;
      imageFileName: string | null;
      imageContentType: string | null;
      pdfObjectKey: string | null;
      pdfFileName: string | null;
      videoObjectKey: string | null;
      videoFileName: string | null;
      videoContentType: string | null;
    },
  >(lesson: T) {
    const [image, pdf, video] = await Promise.all([
      this.s3.signedResource(lesson.imageObjectKey, lesson.imageFileName, lesson.imageContentType),
      this.s3.signedResource(lesson.pdfObjectKey, lesson.pdfFileName, 'application/pdf'),
      this.s3.signedResource(lesson.videoObjectKey, lesson.videoFileName, lesson.videoContentType),
    ]);
    return { ...lesson, resources: { image, pdf, video } };
  }
}
