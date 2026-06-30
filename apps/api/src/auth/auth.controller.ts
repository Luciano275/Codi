import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { User } from '@codi/database';
import { toProfile } from '@codi/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: User) {
    const profile = await this.authService.trackActivity(user);
    return { user: profile };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: User,
    @Body() body: { displayName?: string; email?: string; avatarUrl?: string },
  ) {
    const profile = await this.authService.updateProfile(user.id, body);
    return { user: profile };
  }
}
