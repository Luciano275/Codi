import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminProblemsService } from './admin-problems.service';

@Controller('admin/problems')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminProblemsController {
  constructor(private readonly problems: AdminProblemsService) {}

  @Get()
  @Roles('TEACHER', 'ADMIN')
  async findAll(@Query('search') search?: string) {
    return this.problems.findAll(search);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async updateProblem(
    @Param('id') id: string,
    @Body() body: { difficulty?: string; gemsReward?: number },
  ) {
    return this.problems.update(id, body);
  }
}
