import { Controller, Get, Patch, Param, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/problems')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminProblemsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO codi_problem (id, "cmsTaskId", "cmsTaskName", title, "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, id, name, title, NOW(), NOW() FROM public.tasks
       ON CONFLICT ("cmsTaskId") DO NOTHING`,
    );

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { cmsTaskName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.problem.findMany({
      where,
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
  }

  @Patch(':id')
  async updateProblem(
    @Param('id') id: string,
    @Body() body: { difficulty?: string; gemsReward?: number },
  ) {
    const data: Record<string, unknown> = {};
    if (body.difficulty !== undefined) data.difficulty = body.difficulty;
    if (body.gemsReward !== undefined) data.gemsReward = body.gemsReward;

    return this.prisma.problem.update({
      where: { id },
      data,
      select: { id: true, difficulty: true, gemsReward: true },
    });
  }
}
