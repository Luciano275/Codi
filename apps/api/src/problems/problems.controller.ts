import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        lesson: {
          select: { id: true, title: true },
        },
      },
    });
    if (!problem) throw new NotFoundException('Problem not found');
    return problem;
  }
}
