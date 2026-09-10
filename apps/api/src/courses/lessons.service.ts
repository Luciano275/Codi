import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, RewardType, UserRewardStatus } from '@codi/database';
import { RedisClientType } from 'redis';
import { RedisService } from '../redis/redis.service';
import { S3Service } from '../s3/s3.service';
import { RewardsService } from '../rewards/rewards.service';

const LESSON_CACHE_TTL_SECONDS = 60 * 60;

function getLessonContent(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getSmartHint(value: unknown) {
  const hint = getLessonContent(value).smartHint;
  return typeof hint === 'string' && hint.trim() ? hint.trim() : null;
}

function getHintLessonId(value: unknown) {
  const metadata = getLessonContent(value);
  return metadata.contextType === 'LESSON' && typeof metadata.contextId === 'string'
    ? metadata.contextId
    : null;
}

@Injectable()
export class LessonsService {
  private readonly redis: RedisClientType;

  constructor(
    private readonly prisma: PrismaService,
    redisService: RedisService,
    private readonly s3: S3Service,
    private readonly rewards: RewardsService,
  ) {
    this.redis = redisService.getClient();
  }

  async findOne(userId: string, lessonId: string) {
    const lesson = await this.findCachedLesson(lessonId);
    const [solvedProblemIds, smartHintAccess] = await Promise.all([
      this.findSolvedProblemIds(
        userId,
        lesson.problems.map((problem: { id: string }) => problem.id),
      ),
      lesson.hasSmartHint
        ? this.getSmartHintAccess(userId, lessonId)
        : Promise.resolve({ canUnlock: false, unlocked: false }),
    ]);

    const [image, pdf, video] = await Promise.all([
      this.s3.signedResource(lesson.imageObjectKey, lesson.imageFileName, lesson.imageContentType),
      this.s3.signedResource(lesson.pdfObjectKey, lesson.pdfFileName, 'application/pdf'),
      this.s3.signedResource(lesson.videoObjectKey, lesson.videoFileName, lesson.videoContentType),
    ]);

    const unlockedHint = smartHintAccess.unlocked ? await this.findSmartHint(lessonId) : null;
    return {
      ...lesson,
      resources: { image, pdf, video },
      solvedProblemIds,
      smartHint: lesson.hasSmartHint
        ? { canUnlock: smartHintAccess.canUnlock, content: unlockedHint }
        : null,
    };
  }

  async unlockSmartHint(userId: string, lessonId: string) {
    const hint = await this.findSmartHint(lessonId);
    if (!hint) throw new NotFoundException('Esta lección no tiene una pista inteligente');

    await this.rewards.consumeSmartHintForLesson(userId, lessonId);
    return { hint };
  }

  private async findCachedLesson(lessonId: string) {
    const cacheKey = `lessons:v4:${lessonId}`;
    const cachedLesson = await this.redis.get(cacheKey);

    if (cachedLesson) {
      return JSON.parse(cachedLesson);
    }

    const lesson = this.withoutSmartHint(await this.findLesson(lessonId));

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
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                island: { select: { slug: true, title: true } },
              },
            },
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

  private withoutSmartHint<T extends { content: unknown }>(lesson: T) {
    const content = getLessonContent(lesson.content);
    const { smartHint: _smartHint, ...publicContent } = content;
    return {
      ...lesson,
      content: publicContent,
      hasSmartHint: Boolean(getSmartHint(content)),
    };
  }

  private async findSmartHint(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { content: true },
    });
    if (!lesson) throw new NotFoundException('La lección no existe');
    return getSmartHint(lesson.content);
  }

  private async getSmartHintAccess(userId: string, lessonId: string) {
    const entitlements = await this.prisma.userReward.findMany({
      where: {
        userId,
        reward: { type: RewardType.SMART_HINT },
      },
      select: { status: true, metadata: true },
    });
    const unlocked = entitlements.some(
      (entitlement) =>
        entitlement.status === UserRewardStatus.USED &&
        getHintLessonId(entitlement.metadata) === lessonId,
    );
    return {
      unlocked,
      canUnlock:
        !unlocked && entitlements.some((item) => item.status === UserRewardStatus.AVAILABLE),
    };
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
