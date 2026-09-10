import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@codi/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateRankingRewardsDto } from './dto/update-ranking-rewards.dto';

@Controller('ranking')
export class RankingController {
  constructor(private readonly ranking: RankingService) {}

  @Get('global')
  @UseGuards(JwtAuthGuard)
  async global(
    @CurrentUser() currentUser: User,
    @Query('page') page?: string,
    @Query('period') period?: string,
    @Query('scope') scope?: string,
  ) {
    const parsed = Number.parseInt(page ?? '1', 10);
    const safePage = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    return this.ranking.getGlobal(safePage, currentUser.id, period, scope);
  }

  @Get('rewards')
  @UseGuards(JwtAuthGuard)
  rewards(@CurrentUser() user: User) {
    return this.ranking.getRankingRewards(user.id);
  }

  @Post('rewards/claim')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  claimReward(@CurrentUser() user: User) {
    return this.ranking.claimCurrentPodiumReward(user);
  }

  @Get('rewards/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  adminRewards() {
    return this.ranking.getRankingRewards();
  }

  @Put('rewards/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  updateAdminRewards(@Body() dto: UpdateRankingRewardsDto) {
    return this.ranking.updateRankingRewards(dto.rewards);
  }

  @Get('players/:id')
  @UseGuards(JwtAuthGuard)
  async player(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.ranking.getPlayerProfile(id, currentUser.id);
  }
}
