import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { RedisClientType } from 'redis';
import { RedisService } from '../redis/redis.service';

const LESSON_CACHE_TTL_SECONDS = 60 * 60;

@Injectable()
export class LessonsService {
  private readonly redis: RedisClientType;

  constructor(
    private readonly prisma: PrismaService,
    redisService: RedisService,
  ) {
    this.redis = redisService.getClient();
  }

  async findOne(userId: string, lessonId: string) {
    const lesson = await this.findCachedLesson(lessonId);
    const solvedProblemIds = await this.findSolvedProblemIds(
      userId,
      lesson.problems.map((problem: { id: string }) => problem.id),
    );

    return { ...lesson, solvedProblemIds };
  }

  private async findCachedLesson(lessonId: string) {
    const cacheKey = `lessons:${lessonId}`;
    const cachedLesson = await this.redis.get(cacheKey);

    if (cachedLesson) {
      return JSON.parse(cachedLesson);
    }

    const lesson = await this.findLesson(lessonId);

    await this.redis.set(cacheKey, JSON.stringify(lesson), {
      expiration: {
        type: 'EX',
        value: LESSON_CACHE_TTL_SECONDS,
      },
    });

    return lesson;
  }

  private async findLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, order: true, type: true },
            },
          },
        },
        problems: {
          select: {
            id: true,
            cmsTaskId: true,
            title: true,
            difficulty: true,
            xpReward: true,
            gemsReward: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  private async findSolvedProblemIds(userId: string, problemIds: string[]) {
    const solvedProblems = await this.prisma.submission.findMany({
      where: { userId, problemId: { in: problemIds }, status: 'ACCEPTED' },
      select: { problemId: true },
      distinct: ['problemId'],
    });

    return solvedProblems.map((submission) => submission.problemId);
  }
}
