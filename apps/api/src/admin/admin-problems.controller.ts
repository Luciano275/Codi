import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
    // Auto-sync all CMS tasks into codi_problem so they appear in the picker
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
      },
    });
  }
}
