import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@codi/database';

@Controller('ranking')
export class RankingController {
  constructor(private readonly ranking: RankingService) {}

  @Get('global')
  @UseGuards(JwtAuthGuard)
  async global(@Query('page') page?: string) {
    const parsed = Number.parseInt(page ?? '1', 10);
    const safePage = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    return this.ranking.getGlobal(safePage);
  }

  @Get('players/:id')
  @UseGuards(JwtAuthGuard)
  async player(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.ranking.getPlayerProfile(id, currentUser.id);
  }
}
