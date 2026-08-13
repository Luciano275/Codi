import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import {
  ADMIN_PROBLEMS_CACHE_KEY,
  ContentCacheService,
} from '../content-cache/content-cache.service';

@Injectable()
export class AdminProblemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentCache: ContentCacheService,
  ) {}

  async findAll(search?: string) {
    if (!search) {
      const cachedProblems = await this.contentCache.get<unknown[]>(ADMIN_PROBLEMS_CACHE_KEY);
      if (cachedProblems) return cachedProblems;
    }

    await this.prisma.$executeRaw`
      INSERT INTO codi_problem (id, "cmsTaskId", "cmsTaskName", title, "createdAt", "updatedAt")
      SELECT gen_random_uuid()::text, id, name, title, NOW(), NOW() FROM public.tasks
      ON CONFLICT ("cmsTaskId") DO NOTHING
    `;

    const problems = await this.prisma.problem.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { cmsTaskName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: { cmsTaskId: 'asc' },
      select: {
        id: true,
        cmsTaskId: true,
        cmsTaskName: true,
        title: true,
        difficulty: true,
        xpReward: true,
        gemsReward: true,
      },
    });

    if (!search) await this.contentCache.set(ADMIN_PROBLEMS_CACHE_KEY, problems);
    return problems;
  }

  async update(id: string, updates: { difficulty?: string; gemsReward?: number }) {
    const existing = await this.prisma.problem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Problem not found');

    const data: Record<string, unknown> = {};
    if (updates.difficulty !== undefined) data.difficulty = updates.difficulty;
    if (updates.gemsReward !== undefined) data.gemsReward = updates.gemsReward;

    const problem = await this.prisma.problem.update({
      where: { id },
      data,
      select: {
        id: true,
        difficulty: true,
        gemsReward: true,
        lesson: { select: { id: true, module: { select: { courseId: true } } } },
      },
    });
    await this.contentCache.invalidateProblem(problem.lesson?.id, problem.lesson?.module.courseId);
    return { id: problem.id, difficulty: problem.difficulty, gemsReward: problem.gemsReward };
  }
}
