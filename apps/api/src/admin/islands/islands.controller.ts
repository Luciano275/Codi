import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { User } from '@codi/database';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateIslandDto } from './dto/create-island.dto';
import { UpdateIslandDto } from './dto/update-island.dto';
import { AdminIslandsService } from './islands.service';

@Controller('admin/islands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class AdminIslandsController {
  constructor(private readonly islands: AdminIslandsService) {}

  @Get()
  findAll() {
    return this.islands.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.islands.findOne(id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateIslandDto) {
    return this.islands.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateIslandDto) {
    return this.islands.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.islands.remove(id);
  }
}
