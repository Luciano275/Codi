import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@codi/database';
import { randomUUID } from 'crypto';
import { ContentCacheService } from '../../content-cache/content-cache.service';
import { CreateIslandDto } from './dto/create-island.dto';
import { UpdateIslandDto } from './dto/update-island.dto';
import { IslandModelService } from './island-model.service';
import { createIslandSlug } from './island-slug';

@Injectable()
export class AdminIslandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly islandModels: IslandModelService,
    private readonly contentCache: ContentCacheService,
  ) {}

  async findAll() {
    const islands = await this.prisma.island.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        accent: true,
        order: true,
        available: true,
        createdAt: true,
        updatedAt: true,
        modelPath: true,
        modelObjectKey: true,
        _count: { select: { courses: true } },
      },
    });
    return Promise.all(islands.map((island) => this.islandModels.resolve(island)));
  }

  async findOne(id: string) {
    const island = await this.prisma.island.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        accent: true,
        order: true,
        available: true,
        createdAt: true,
        updatedAt: true,
        modelPath: true,
        modelObjectKey: true,
        courses: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            level: true,
            region: true,
            xpReward: true,
            order: true,
            modules: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                _count: { select: { lessons: true } },
              },
            },
          },
        },
        _count: { select: { courses: true } },
      },
    });
    if (!island) throw new NotFoundException('Island not found');
    return this.islandModels.resolve(island);
  }

  async create(userId: string, dto: CreateIslandDto) {
    const { modelUploadKey, ...fields } = dto;
    const id = randomUUID();
    const slug = dto.slug ?? createIslandSlug(dto.title);
    await this.assertSlugAvailable(slug);
    const model = await this.islandModels.promote(userId, modelUploadKey, id);

    try {
      const island = await this.prisma.island.create({
        data: {
          id,
          ...fields,
          slug,
          modelObjectKey: model?.objectKey,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          accent: true,
          order: true,
          available: true,
          createdAt: true,
          updatedAt: true,
          modelPath: true,
          modelObjectKey: true,
          _count: { select: { courses: true } },
        },
      });
      await this.contentCache.invalidateIslands();
      return this.islandModels.resolve(island);
    } catch (error) {
      await this.islandModels.delete(model?.objectKey);
      this.rethrowWriteError(error);
    }
  }

  async update(userId: string, id: string, dto: UpdateIslandDto) {
    const existing = await this.prisma.island.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Island not found');
    const { modelUploadKey, ...fields } = dto;
    if (fields.slug && fields.slug !== existing.slug) await this.assertSlugAvailable(fields.slug);
    const model = await this.islandModels.promote(userId, modelUploadKey, id);

    try {
      await this.prisma.island.update({
        where: { id },
        data: { ...fields, ...(model ? { modelObjectKey: model.objectKey } : {}) },
      });
      await this.contentCache.invalidateIslands();
      if (model) await this.islandModels.delete(existing.modelObjectKey);
      return this.findOne(id);
    } catch (error) {
      await this.islandModels.delete(model?.objectKey);
      this.rethrowWriteError(error);
    }
  }

  async remove(id: string) {
    const island = await this.prisma.island.findUnique({
      where: { id },
      select: { modelObjectKey: true, _count: { select: { courses: true } } },
    });
    if (!island) throw new NotFoundException('Island not found');
    if (island._count.courses > 0) {
      throw new ConflictException(
        'La isla tiene cursos asociados. Desasociá o trasladá los cursos antes de eliminarla.',
      );
    }

    await this.prisma.island.delete({ where: { id } });
    await this.contentCache.invalidateIslands();
    await this.islandModels.delete(island.modelObjectKey);
    return { deleted: true };
  }

  private async assertSlugAvailable(slug: string) {
    const island = await this.prisma.island.findUnique({ where: { slug }, select: { id: true } });
    if (island) throw new ConflictException('Ya existe una isla con ese slug');
  }

  private rethrowWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Ya existe una isla con ese slug');
    }
    throw error;
  }
}
