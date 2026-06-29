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
