import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminLessonsService } from './admin-lessons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Controller('admin/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminLessonsController {
  constructor(private readonly lessons: AdminLessonsService) {}

  @Get()
  async findAll() {
    return this.lessons.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.lessons.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateLessonDto) {
    return this.lessons.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessons.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.lessons.remove(id);
  }
}
