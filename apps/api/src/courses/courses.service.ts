import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { updateUserExperience } from '../progression/update-user-experience';
import { RedisService } from '../redis/redis.service';
import { RedisClientType } from 'redis';
import {
  ContentCacheService,
  COURSE_PATHS_CACHE_KEY,
  ISLAND_PATHS_CACHE_KEY,
  ISLANDS_CACHE_KEY,
} from '../content-cache/content-cache.service';

const COURSES_CACHE_TTL_SECONDS = 60 * 60;

export interface UserProgressCache {
  totalLessons: number;
  completedLessons: number;
  completedLessonIds: string[];
  courses: {
    courseId: string;
    courseTitle: string;
    completedLessons: number;
    totalLessons: number;
    completed: boolean;
  }[];
}

@Injectable()
export class CoursesService {
  private redis: RedisClientType;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly contentCache: ContentCacheService,
  ) {
    this.redis = redisService.getClient();
  }

  async findAll() {
    const cached = await this.redis.get('courses:all');
    if (cached) {
      return JSON.parse(cached);
    }

    const result = this.prisma.course.findMany({
      orderBy: { order: 'asc' },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                problems: {
                  select: {
                    id: true,
                    cmsTaskId: true,
                    title: true,
                    difficulty: true,
                    xpReward: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    await this.redis.set('courses:all', JSON.stringify(await result), {
      expiration: {
        type: 'EX',
        value: COURSES_CACHE_TTL_SECONDS,
      },
    });

    return result;
  }

  async findIslands() {
    const cached = await this.contentCache.get<unknown[]>(ISLANDS_CACHE_KEY);
    if (cached) return cached;

    const islands = await this.prisma.island.findMany({
      orderBy: { order: 'asc' },
      include: {
        courses: {
          orderBy: { order: 'asc' },
          select: { id: true, title: true, order: true, _count: { select: { modules: true } } },
        },
      },
    });
    await this.contentCache.set(ISLANDS_CACHE_KEY, islands);
    return islands;
  }

  async findIslandPath(slug: string) {
    const cachedPaths = await this.contentCache.get<Record<string, unknown>>(ISLAND_PATHS_CACHE_KEY);
    const cachedPath = cachedPaths?.[slug];
    if (cachedPath) return cachedPath;

    const island = await this.prisma.island.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        available: true,
        accent: true,
        order: true,
        courses: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            level: true,
            region: true,
            xpReward: true,
            _count: { select: { modules: true } },
          },
        },
      },
    });
    if (!island) throw new NotFoundException('Island not found');

    const path = island;
    await this.contentCache.set(ISLAND_PATHS_CACHE_KEY, { ...cachedPaths, [slug]: path });
    return path;
  }

  async findCoursePath(courseId: string) {
    const cachedPaths = await this.contentCache.get<Record<string, unknown>>(COURSE_PATHS_CACHE_KEY);
    const cachedPath = cachedPaths?.[courseId];
    if (cachedPath) return cachedPath;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        island: { select: { slug: true, title: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, order: true, type: true, xpReward: true },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    await this.contentCache.set(COURSE_PATHS_CACHE_KEY, { ...cachedPaths, [courseId]: course });
    return course;
  }

  async findOne(id: string) {
    const cached = await this.redis.get(`courses:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                problems: {
                  select: {
                    id: true,
                    cmsTaskId: true,
                    title: true,
                    difficulty: true,
                    xpReward: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    await this.redis.set(`courses:${id}`, JSON.stringify(course), {
      expiration: {
        type: 'EX',
        value: COURSES_CACHE_TTL_SECONDS,
      },
    });

    return course;
  }

  async getProgress(userId: string) {
    const progressKey = this.contentCache.userProgressKey(userId);
    const cached = await this.contentCache.get<UserProgressCache>(progressKey);
    if (cached) return cached;

    const courses = await this.prisma.course.findMany({
      orderBy: { order: 'asc' },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                problems: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    const totalLessons = courses.reduce(
      (sum, c) => sum + c.modules.reduce((s, m) => s + m.lessons.length, 0),
      0,
    );

    const completedLessons = await this.prisma.lessonCompletion.findMany({
      where: { userId },
      select: { lessonId: true },
    });

    const completedLessonIds = new Set(completedLessons.map((c) => c.lessonId));

    const isLessonCompleted = (lesson: { id: string }) => completedLessonIds.has(lesson.id);

    const courseProgress = courses.map((course) => {
      const totalCourseLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

      const completed = course.modules.reduce(
        (s, m) => s + m.lessons.filter(isLessonCompleted).length,
        0,
      );

      return {
        courseId: course.id,
        courseTitle: course.title,
        completedLessons: completed,
        totalLessons: totalCourseLessons,
        completed: completed === totalCourseLessons && totalCourseLessons > 0,
      };
    });

    const completedOverall = courseProgress.reduce((s, c) => s + c.completedLessons, 0);

    const progress = {
      totalLessons,
      completedLessons: completedOverall,
      completedLessonIds: [...completedLessonIds],
      courses: courseProgress,
    };
    await this.contentCache.set(progressKey, progress);
    return progress;
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, xpReward: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const existing = await this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (existing) throw new ConflictException('Lesson already completed');

    // Validate all exercises have score >= 60
    const problems = await this.prisma.problem.findMany({
      where: { lessonId },
      select: { id: true },
    });
    if (problems.length > 0) {
      const problemIds = problems.map((p) => p.id);
      const bestScores = await this.prisma.submission.groupBy({
        by: ['problemId'],
        where: {
          userId,
          problemId: { in: problemIds },
          status: 'ACCEPTED',
          score: { gte: 60 },
        },
        _max: { score: true },
      });
      const qualifiedProblemIds = new Set(bestScores.map((s) => s.problemId));
      const missing = problemIds.filter((id) => !qualifiedProblemIds.has(id));
      if (missing.length > 0) {
        throw new ForbiddenException(
          `Debés resolver todos los ejercicios con al menos 60 puntos antes de completar la lección. Faltan ${missing.length} ejercicio(s).`,
        );
      }
    }

    const award = await this.prisma.$transaction(async (transaction) => {
      const xpAward = await updateUserExperience(transaction, userId, lesson.xpReward);
      await transaction.lessonCompletion.create({
        data: { userId, lessonId, xpAwarded: xpAward.xpAwarded },
      });
      return xpAward.xpAwarded;
    });

    await this.contentCache.invalidateUserProgress(userId);
    return { completed: true, xpAwarded: award };
  }

  async uncompleteLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, xpReward: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const existing = await this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (!existing) throw new NotFoundException('Lesson not completed');

    await this.prisma.$transaction(async (transaction) => {
      await transaction.lessonCompletion.delete({
        where: { userId_lessonId: { userId, lessonId } },
      });
      await updateUserExperience(transaction, userId, -(existing.xpAwarded || lesson.xpReward));
    });

    await this.contentCache.invalidateUserProgress(userId);
    return { completed: false, xpRefunded: existing.xpAwarded || lesson.xpReward };
  }

  async getLessonStatus(userId: string, lessonId: string) {
    const completion = await this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    return { completed: !!completion, completedAt: completion?.completedAt ?? null };
  }
}
