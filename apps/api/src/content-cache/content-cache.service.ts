import { Injectable, Logger } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { RedisService } from '../redis/redis.service';

export const ADMIN_LESSONS_CACHE_KEY = 'admin:lessons:all:v2';
export const ADMIN_PROBLEMS_CACHE_KEY = 'admin:problems:all';
export const ADMIN_COURSES_CACHE_KEY = 'admin:courses:all';
export const ISLANDS_CACHE_KEY = 'islands:summary:v4';
export const ISLAND_PATHS_CACHE_KEY = 'islands:paths:v4';
export const COURSE_PATHS_CACHE_KEY = 'courses:paths:submodules:v3';
export const CONTENT_CACHE_TTL_SECONDS = 60 * 60;

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

  async set(key: string, value: unknown, ttlSeconds = CONTENT_CACHE_TTL_SECONDS) {
    if (!this.redisService.isReady()) return;

    try {
      await this.redis.set(key, JSON.stringify(value), {
        expiration: { type: 'EX', value: ttlSeconds },
      });
    } catch (error) {
      this.logger.warn(`No se pudo escribir la caché ${key}: ${String(error)}`);
    }
  }

  async invalidateLesson(lessonId: string, courseIds: string[]) {
    await this.delete([
      ADMIN_LESSONS_CACHE_KEY,
      `lessons:${lessonId}`,
      `lessons:v2:${lessonId}`,
      `lessons:v3:${lessonId}`,
      `lessons:v4:${lessonId}`,
      ...this.courseKeys(courseIds),
    ]);
  }

  async invalidateCourseTree(courseIds: string[]) {
    await this.delete([ADMIN_LESSONS_CACHE_KEY, ...this.courseKeys(courseIds)]);
  }

  async invalidateIslands() {
    await this.delete([
      ISLANDS_CACHE_KEY,
      ISLAND_PATHS_CACHE_KEY,
      COURSE_PATHS_CACHE_KEY,
      ADMIN_COURSES_CACHE_KEY,
      'courses:all',
      'courses:all:v2',
    ]);
  }

  async invalidateUserProgress(userId: string) {
    await this.delete([this.userProgressKey(userId)]);
  }

  userProgressKey(userId: string) {
    return `progress:user:${userId}`;
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
    const validCourseIds = courseIds.filter(Boolean);

    return [
      'courses:all',
      ISLANDS_CACHE_KEY,
      ISLAND_PATHS_CACHE_KEY,
      COURSE_PATHS_CACHE_KEY,
      ADMIN_COURSES_CACHE_KEY,
      ...validCourseIds.flatMap((courseId) => [
        `courses:${courseId}`,
        `courses:v2:${courseId}`,
        `admin:courses:${courseId}`,
      ]),
    ];
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
