import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, PrismaService } from '@codi/database';
import { updateUserExperience } from '../progression/update-user-experience';
import { RedisService } from '../redis/redis.service';
import { RedisClientType } from 'redis';
import {
  ContentCacheService,
  COURSE_PATHS_CACHE_KEY,
  ISLAND_PATHS_CACHE_KEY,
  ISLANDS_CACHE_KEY,
} from '../content-cache/content-cache.service';
import { S3Service } from '../s3/s3.service';

const COURSES_CACHE_TTL_SECONDS = 60 * 60;
const DEFAULT_ISLAND_MODEL_PATH = '/islands/isla.glb';

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

export interface IslandModelCacheEntry {
  modelObjectKey: string | null;
  modelPath: string;
}

@Injectable()
export class CoursesService {
  private redis: RedisClientType;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly contentCache: ContentCacheService,
    private readonly s3: S3Service,
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
    const cached = await this.contentCache.get<IslandModelCacheEntry[]>(ISLANDS_CACHE_KEY);
    if (cached) return Promise.all(cached.map((island) => this.withResolvedIslandModel(island)));

    const islands = await this.prisma.island.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        modelObjectKey: true,
        modelPath: true,
        available: true,
        accent: true,
        order: true,
        courses: {
          orderBy: { order: 'asc' },
          select: { id: true, title: true, order: true, _count: { select: { modules: true } } },
        },
      },
    });
    await this.contentCache.set(ISLANDS_CACHE_KEY, islands);
    return Promise.all(islands.map((island) => this.withResolvedIslandModel(island)));
  }

  async findIslandPath(slug: string) {
    const cachedPaths =
      await this.contentCache.get<Record<string, unknown>>(ISLAND_PATHS_CACHE_KEY);
    const cachedPath = cachedPaths?.[slug] as IslandModelCacheEntry | undefined;
    if (cachedPath) return this.withResolvedIslandModel(cachedPath);

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
        modelObjectKey: true,
        modelPath: true,
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

    await this.contentCache.set(ISLAND_PATHS_CACHE_KEY, { ...cachedPaths, [slug]: island });
    return this.withResolvedIslandModel(island);
  }

  async findCoursePath(courseId: string) {
    const cachedPaths =
      await this.contentCache.get<Record<string, unknown>>(COURSE_PATHS_CACHE_KEY);
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
              select: {
                id: true,
                title: true,
                order: true,
                type: true,
                xpReward: true,
                gemsReward: true,
              },
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
      select: { id: true, xpReward: true, gemsReward: true },
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

    let award: { xpAwarded: number; gemsAwarded: number };
    try {
      award = await this.runSerializableTransaction(async (transaction) => {
        await transaction.lessonCompletion.create({
          data: { userId, lessonId, gemsAwarded: lesson.gemsReward },
        });
        const xpAward = await updateUserExperience(transaction, userId, lesson.xpReward);
        if (lesson.gemsReward > 0) {
          await transaction.user.update({
            where: { id: userId },
            data: { gems: { increment: lesson.gemsReward } },
          });
        }
        await transaction.lessonCompletion.update({
          where: { userId_lessonId: { userId, lessonId } },
          data: { xpAwarded: xpAward.xpAwarded },
        });
        return { xpAwarded: xpAward.xpAwarded, gemsAwarded: lesson.gemsReward };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Lesson already completed');
      }
      throw error;
    }

    await this.contentCache.invalidateUserProgress(userId);
    return { completed: true, ...award };
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

    await this.runSerializableTransaction(async (transaction) => {
      await transaction.lessonCompletion.delete({
        where: { userId_lessonId: { userId, lessonId } },
      });
      await updateUserExperience(transaction, userId, -(existing.xpAwarded || lesson.xpReward));
      await this.removeAwardedGems(transaction, userId, existing.gemsAwarded);
    });

    await this.contentCache.invalidateUserProgress(userId);
    return {
      completed: false,
      xpRefunded: existing.xpAwarded || lesson.xpReward,
      gemsRefunded: existing.gemsAwarded,
    };
  }

  async getLessonStatus(userId: string, lessonId: string) {
    const completion = await this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    return { completed: !!completion, completedAt: completion?.completedAt ?? null };
  }

  private async withResolvedIslandModel<
    T extends { modelObjectKey: string | null; modelPath: string },
  >(island: T) {
    const { modelObjectKey, modelPath, ...publicIsland } = island;
    const model = await this.s3.signedResource(modelObjectKey, null, 'model/gltf-binary');
    return { ...publicIsland, modelPath: model?.url ?? modelPath ?? DEFAULT_ISLAND_MODEL_PATH };
  }

  private async removeAwardedGems(
    transaction: Prisma.TransactionClient,
    userId: string,
    gemsAwarded: number,
  ) {
    if (gemsAwarded <= 0) return;
    const result = await transaction.user.updateMany({
      where: { id: userId, gems: { gte: gemsAwarded } },
      data: { gems: { decrement: gemsAwarded } },
    });
    if (result.count === 0) {
      await transaction.user.update({ where: { id: userId }, data: { gems: 0 } });
    }
  }

  private async runSerializableTransaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        const isRetryable =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
        if (!isRetryable || attempt === maxAttempts) throw error;
      }
    }
    throw new Error('No se pudo completar la transacción');
  }
}
