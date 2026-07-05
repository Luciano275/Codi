import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@codi/database';

class SubmitDto {
  problemId!: string;
  code!: string;
  language!: string;
}

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async submit(@CurrentUser() user: User, @Body() dto: SubmitDto) {
    return this.submissions.submit(user.id, dto.problemId, dto.code, dto.language);
  }

  @Post('evaluate')
  @UseGuards(JwtAuthGuard)
  async evaluate(@CurrentUser() user: User, @Body() dto: SubmitDto) {
    return this.submissions.submit(user.id, dto.problemId, dto.code, dto.language);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: User) {
    return this.submissions.findByUser(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@Param('id') id: string) {
    return this.submissions.findById(id);
  }
}
