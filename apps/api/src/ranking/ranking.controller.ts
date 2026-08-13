import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ranking')
export class RankingController {
  constructor(private readonly ranking: RankingService) {}

  @Get('global')
  @UseGuards(JwtAuthGuard)
  async global(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 50;
    const safeLimit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : 50;
    return this.ranking.getGlobal(safeLimit);
  }

  @Get('players/:id')
  @UseGuards(JwtAuthGuard)
  async player(@Param('id') id: string) {
    return this.ranking.getPlayerProfile(id);
  }
}
