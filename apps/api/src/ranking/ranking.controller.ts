import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ranking')
export class RankingController {
  constructor(private readonly ranking: RankingService) {}

  @Get('global')
  @UseGuards(JwtAuthGuard)
  async global(@Query('limit') limit?: string) {
    return this.ranking.getGlobal(limit ? parseInt(limit, 10) : 50);
  }
}
