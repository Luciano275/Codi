import { Injectable, Logger } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { RedisService } from '../redis/redis.service';

export const ADMIN_LESSONS_CACHE_KEY = 'admin:lessons:all';
export const ADMIN_PROBLEMS_CACHE_KEY = 'admin:problems:all';
export const CONTENT_LIST_CACHE_TTL_SECONDS = 10 * 60;

@Injectable()
export class ContentCacheService {
  private readonly logger = new Logger(ContentCacheService.name);
  private readonly redis: RedisClientType;

  constructor(private readonly redisService: RedisService) {
    this.redis = redisService.getClient();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redisService.isReady()) return null;

    try {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.warn(`No se pudo leer la caché ${key}: ${String(error)}`);
      return null;
    }
  }

  async set(key: string, value: unknown) {
    if (!this.redisService.isReady()) return;

    try {
      await this.redis.set(key, JSON.stringify(value), {
        expiration: { type: 'EX', value: CONTENT_LIST_CACHE_TTL_SECONDS },
      });
    } catch (error) {
      this.logger.warn(`No se pudo escribir la caché ${key}: ${String(error)}`);
    }
  }

  async invalidateLesson(lessonId: string, courseIds: string[]) {
    await this.delete([
      ADMIN_LESSONS_CACHE_KEY,
      `lessons:${lessonId}`,
      ...this.courseKeys(courseIds),
    ]);
  }

  async invalidateCourseTree(courseIds: string[]) {
    await this.delete([ADMIN_LESSONS_CACHE_KEY, ...this.courseKeys(courseIds)]);
  }

  async invalidateProblem(lessonId?: string, courseId?: string) {
    await this.delete([
      ADMIN_PROBLEMS_CACHE_KEY,
      ADMIN_LESSONS_CACHE_KEY,
      ...this.courseKeys(courseId ? [courseId] : []),
      ...(lessonId ? [`lessons:${lessonId}`] : []),
    ]);
  }

  private courseKeys(courseIds: string[]) {
    return ['courses:all', ...courseIds.filter(Boolean).map((courseId) => `courses:${courseId}`)];
  }

  private async delete(keys: string[]) {
    if (!this.redisService.isReady()) return;

    try {
      await this.redis.del([...new Set(keys)]);
    } catch (error) {
      this.logger.warn(`No se pudo invalidar la caché de contenido: ${String(error)}`);
    }
  }
}
