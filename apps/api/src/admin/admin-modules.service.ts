import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ContentCacheService } from '../content-cache/content-cache.service';

@Injectable()
export class AdminModulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentCache: ContentCacheService,
  ) {}

  async findByCourse(courseId: string) {
    return this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { lessons: true } } },
    });
  }

  async findOne(id: string) {
    const mod = await this.prisma.module.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { problems: true } } },
        },
      },
    });
    if (!mod) throw new NotFoundException('Module not found');
    return mod;
  }

  async create(dto: CreateModuleDto) {
    const module = await this.prisma.module.create({ data: dto });
    await this.contentCache.invalidateCourseTree([module.courseId]);
    return module;
  }

  async update(id: string, dto: UpdateModuleDto) {
    try {
      const existing = await this.prisma.module.findUnique({
        where: { id },
        select: { courseId: true },
      });
      if (!existing) throw new NotFoundException('Module not found');
      const module = await this.prisma.module.update({ where: { id }, data: dto });
      await this.contentCache.invalidateCourseTree([existing.courseId, module.courseId]);
      return module;
    } catch {
      throw new NotFoundException('Module not found');
    }
  }

  async remove(id: string) {
    try {
      const existing = await this.prisma.module.findUnique({
        where: { id },
        select: { courseId: true },
      });
      if (!existing) throw new NotFoundException('Module not found');
      await this.prisma.module.delete({ where: { id } });
      await this.contentCache.invalidateCourseTree([existing.courseId]);
    } catch {
      throw new NotFoundException('Module not found');
    }
  }
}
