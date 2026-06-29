import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class AdminModulesService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.module.create({ data: dto });
  }

  async update(id: string, dto: UpdateModuleDto) {
    try {
      return await this.prisma.module.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('Module not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.module.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Module not found');
    }
  }
}
