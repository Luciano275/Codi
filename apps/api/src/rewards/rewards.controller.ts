import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { User } from '@codi/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConsumeRewardDto } from './dto/consume-reward.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RewardsService } from './rewards.service';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get('store')
  getStore(@CurrentUser() user: User) {
    return this.rewards.getStore(user.id);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  getCatalog() {
    return this.rewards.getCatalog();
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  create(@Body() dto: CreateRewardDto) {
    return this.rewards.createReward(dto);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  update(@Param('id') rewardId: string, @Body() dto: UpdateRewardDto) {
    return this.rewards.updateReward(rewardId, dto);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  remove(@Param('id') rewardId: string) {
    return this.rewards.removeReward(rewardId);
  }

  @Post(':id/redeem')
  redeem(@CurrentUser() user: User, @Param('id') rewardId: string, @Body() dto: RedeemRewardDto) {
    return this.rewards.redeem(user.id, rewardId, dto);
  }

  @Post('entitlements/:id/consume')
  consume(
    @CurrentUser() user: User,
    @Param('id') entitlementId: string,
    @Body() dto: ConsumeRewardDto,
  ) {
    return this.rewards.consume(user.id, entitlementId, dto);
  }
}
