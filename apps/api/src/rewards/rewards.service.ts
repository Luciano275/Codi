import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PrismaService,
  RewardRedemptionStatus,
  RewardType,
  UserRewardStatus,
  type Reward,
  type UserReward,
} from '@codi/database';
import { S3Service } from '../s3/s3.service';
import { ConsumeRewardDto } from './dto/consume-reward.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

const RETRY_LIMIT = 3;
const STUDENTS_PAGE_SIZE = 20;

type RewardMetadata = Record<string, unknown>;

function getMetadata(value: unknown): RewardMetadata {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RewardMetadata)
    : {};
}

function getTrimester(value: unknown): number | undefined {
  const trimester = getMetadata(value).trimester;
  return typeof trimester === 'number' ? trimester : undefined;
}

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async getCatalog() {
    const rewards = await this.prisma.reward.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { redemptions: true } } },
    });
    return rewards.map((reward) => this.toAdminReward(reward));
  }

  async createReward(dto: CreateRewardDto) {
    const reward = await this.prisma.reward.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        cost: dto.cost,
        type: dto.type,
        isActive: dto.isActive,
        metadata: this.editorMetadata(dto) as Prisma.InputJsonValue,
      },
      include: { _count: { select: { redemptions: true } } },
    });
    return this.toAdminReward(reward);
  }

  async updateReward(rewardId: string, dto: UpdateRewardDto) {
    const existing = await this.prisma.reward.findUnique({ where: { id: rewardId } });
    if (!existing) throw new NotFoundException('La recompensa no existe');

    const reward = await this.prisma.reward.update({
      where: { id: rewardId },
      data: {
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        cost: dto.cost,
        type: dto.type,
        isActive: dto.isActive,
        metadata: this.editorMetadata(
          dto,
          this.imageObjectKey(getMetadata(existing.metadata)),
        ) as Prisma.InputJsonValue,
      },
      include: { _count: { select: { redemptions: true } } },
    });
    return this.toAdminReward(reward);
  }

  async removeReward(rewardId: string) {
    const redemptionCount = await this.prisma.rewardRedemption.count({ where: { rewardId } });
    if (redemptionCount > 0) {
      throw new ConflictException(
        'No se puede eliminar una recompensa que ya tiene canjes. Desactívala en su lugar.',
      );
    }
    await this.prisma.reward.delete({ where: { id: rewardId } });
    return { removed: true, id: rewardId };
  }

  async getAdminRedemptions(page: number) {
    const skip = (page - 1) * STUDENTS_PAGE_SIZE;
    const [totalStudents, students] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
        skip,
        take: STUDENTS_PAGE_SIZE,
        select: {
          id: true,
          username: true,
          displayName: true,
          gems: true,
          rewardRedemptions: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              metadata: true,
              createdAt: true,
              reward: { select: { name: true, type: true } },
              entitlement: {
                select: { id: true, status: true, expiresAt: true },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalStudents / STUDENTS_PAGE_SIZE));
    return {
      items: students.map((student) => ({
        ...student,
        redemptions: student.rewardRedemptions.map((redemption) =>
          this.toRewardRedemptionSummary(redemption),
        ),
      })),
      page,
      pageSize: STUDENTS_PAGE_SIZE,
      totalStudents,
      totalPages,
    };
  }

  async revokeRedemption(redemptionId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const redemption = await transaction.rewardRedemption.findUnique({
        where: { id: redemptionId },
        include: { entitlement: true },
      });
      if (!redemption) throw new NotFoundException('El canje no existe');
      if (redemption.status === RewardRedemptionStatus.REVOKED) {
        throw new ConflictException('Este canje ya fue revocado');
      }
      if (!redemption.entitlement) {
        throw new ConflictException('Este canje ya no tiene una recompensa para revocar');
      }
      if (redemption.entitlement.status === UserRewardStatus.USED) {
        throw new ConflictException('No se puede revocar una recompensa que ya fue utilizada');
      }

      await transaction.userReward.delete({ where: { id: redemption.entitlement.id } });
      await transaction.rewardRedemption.update({
        where: { id: redemptionId },
        data: { status: RewardRedemptionStatus.REVOKED },
      });

      return { revoked: true, id: redemptionId, userId: redemption.userId };
    });
  }

  async getStore(userId: string) {
    const now = new Date();
    await this.prisma.userReward.updateMany({
      where: {
        userId,
        status: UserRewardStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      data: { status: UserRewardStatus.EXPIRED },
    });
    const [user, rewards, entitlements, redemptions] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { gems: true } }),
      this.prisma.reward.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.userReward.findMany({
        where: { userId },
        include: { reward: { select: { type: true } } },
      }),
      this.prisma.rewardRedemption.findMany({
        where: { userId, status: RewardRedemptionStatus.COMPLETED },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          reward: { select: { name: true, type: true } },
          entitlement: true,
        },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    return {
      gems: user.gems,
      rewards: await Promise.all(
        rewards.map((reward) => this.toStoreReward(reward, entitlements, user.gems, now)),
      ),
      recentRewards: redemptions.map((redemption) => {
        const entitlement = redemption.entitlement;
        return {
          id: redemption.id,
          name: redemption.reward.name,
          type: redemption.reward.type,
          status: entitlement ? this.effectiveStatus(entitlement, now) : 'USED',
          redeemedAt: redemption.createdAt,
          expiresAt: entitlement?.expiresAt ?? null,
          trimester: getTrimester(redemption.metadata),
        };
      }),
    };
  }

  async redeem(userId: string, rewardId: string, dto: RedeemRewardDto) {
    for (let attempt = 0; attempt < RETRY_LIMIT; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const existing = await transaction.rewardRedemption.findUnique({
              where: { userId_requestId: { userId, requestId: dto.requestId } },
            });
            if (existing) return this.redemptionResponse(transaction, userId, existing.id);

            const reward = await transaction.reward.findFirst({
              where: { id: rewardId, isActive: true },
            });
            if (!reward) throw new NotFoundException('La recompensa no está disponible');

            await this.validateRedemption(transaction, userId, reward, dto);

            const debit = await transaction.user.updateMany({
              where: { id: userId, gems: { gte: reward.cost } },
              data: { gems: { decrement: reward.cost } },
            });
            if (debit.count !== 1) {
              throw new ForbiddenException('No tenés suficientes gemas para este canje');
            }

            const redemption = await transaction.rewardRedemption.create({
              data: {
                userId,
                rewardId: reward.id,
                requestId: dto.requestId,
                costPaid: reward.cost,
                metadata: this.redemptionMetadata(reward, dto),
              },
            });

            const entitlement = await this.grantEntitlement(
              transaction,
              userId,
              reward,
              redemption.id,
              dto,
            );

            return this.redemptionResponse(transaction, userId, redemption.id, entitlement);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10000 },
        );
      } catch (error) {
        if (this.isWriteConflict(error) && attempt < RETRY_LIMIT - 1) continue;
        throw error;
      }
    }

    throw new ConflictException('No pudimos completar el canje. Intentá nuevamente.');
  }

  async consume(userId: string, entitlementId: string, dto: ConsumeRewardDto) {
    const entitlement = await this.prisma.userReward.findFirst({
      where: { id: entitlementId, userId },
      include: { reward: true },
    });
    if (!entitlement) throw new NotFoundException('Recompensa no encontrada');
    if (entitlement.status !== UserRewardStatus.AVAILABLE) {
      throw new ConflictException('Esta recompensa ya no está disponible');
    }

    const correctContext =
      (entitlement.reward.type === RewardType.SMART_HINT && dto.contextType === 'PROBLEM') ||
      (entitlement.reward.type === RewardType.EXAM_BONUS_POINT && dto.contextType === 'EXAM');
    if (!correctContext)
      throw new ForbiddenException('El contexto no corresponde a esta recompensa');

    const result = await this.prisma.userReward.updateMany({
      where: { id: entitlement.id, status: UserRewardStatus.AVAILABLE },
      data: {
        status: UserRewardStatus.USED,
        usedAt: new Date(),
        metadata: {
          ...getMetadata(entitlement.metadata),
          contextType: dto.contextType,
          contextId: dto.contextId,
        },
      },
    });
    if (result.count !== 1) throw new ConflictException('Esta recompensa ya fue utilizada');

    return { consumed: true, entitlementId };
  }

  async consumeSmartHintForLesson(userId: string, lessonId: string) {
    const entitlement = await this.prisma.userReward.findFirst({
      where: {
        userId,
        status: UserRewardStatus.AVAILABLE,
        reward: { type: RewardType.SMART_HINT },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!entitlement) {
      throw new ConflictException('Canjeá una Pista Inteligente en la tienda para desbloquearla');
    }

    const result = await this.prisma.userReward.updateMany({
      where: { id: entitlement.id, userId, status: UserRewardStatus.AVAILABLE },
      data: {
        status: UserRewardStatus.USED,
        usedAt: new Date(),
        metadata: { contextType: 'LESSON', contextId: lessonId },
      },
    });
    if (result.count !== 1) {
      throw new ConflictException('La Pista Inteligente ya fue utilizada');
    }

    return { consumed: true, entitlementId: entitlement.id };
  }

  private async toStoreReward(
    reward: Reward,
    entitlements: Array<UserReward & { reward: { type: RewardType } }>,
    gems: number,
    now: Date,
  ) {
    const rewardEntitlements = entitlements.filter((item) => item.rewardId === reward.id);
    const activeEntitlement = rewardEntitlements.find(
      (item) => this.effectiveStatus(item, now) === UserRewardStatus.ACTIVE,
    );
    const availableEntitlement = rewardEntitlements.find(
      (item) => this.effectiveStatus(item, now) === UserRewardStatus.AVAILABLE,
    );
    const acquiredTrimesters = rewardEntitlements
      .map((item) => getTrimester(item.metadata))
      .filter((trimester): trimester is number => trimester !== undefined);

    const metadata = getMetadata(reward.metadata);
    const allowedTrimesters = Array.isArray(metadata.allowedTrimesters)
      ? metadata.allowedTrimesters.filter((item): item is number => typeof item === 'number')
      : [];
    const isFullyAcquired =
      reward.type === RewardType.EXAM_BONUS_POINT &&
      allowedTrimesters.length > 0 &&
      allowedTrimesters.every((trimester) => acquiredTrimesters.includes(trimester));
    const unavailable =
      reward.type === RewardType.EXAM_BONUS_POINT
        ? isFullyAcquired
        : Boolean(activeEntitlement) || Boolean(availableEntitlement);
    const missingGems = Math.max(0, reward.cost - gems);
    const status = activeEntitlement
      ? 'ACTIVE'
      : unavailable
        ? 'ACQUIRED'
        : missingGems > 0
          ? 'INSUFFICIENT_GEMS'
          : 'AVAILABLE';
    const entitlement = activeEntitlement ?? availableEntitlement ?? rewardEntitlements[0];

    const imageObjectKey = this.imageObjectKey(metadata);
    const image = imageObjectKey
      ? await this.s3.signedResource(imageObjectKey, null, 'image/webp')
      : null;
    return {
      id: reward.id,
      slug: reward.slug,
      name: reward.name,
      description: reward.description,
      category: reward.category,
      cost: reward.cost,
      type: reward.type,
      visual: metadata.visual ?? 'hint',
      color: this.rewardColor(metadata),
      icon: this.rewardIcon(metadata),
      imageUrl: image?.url,
      canRedeem: !unavailable && missingGems === 0,
      missingGems,
      status,
      acquiredTrimesters,
      entitlement: entitlement
        ? {
            id: entitlement.id,
            status: this.effectiveStatus(entitlement, now),
            expiresAt: entitlement.expiresAt,
            trimester: getTrimester(entitlement.metadata),
          }
        : undefined,
    };
  }

  private async grantEntitlement(
    transaction: Prisma.TransactionClient,
    userId: string,
    reward: Reward,
    redemptionId: string,
    dto: RedeemRewardDto,
  ) {
    const now = new Date();
    if (reward.type === RewardType.EXAM_BONUS_POINT) {
      if (!dto.trimester)
        throw new ForbiddenException('Elegí el trimestre para aplicar el punto extra');
      const slotKey = `trimester:${dto.trimester}`;
      const existing = await transaction.userReward.findFirst({
        where: { userId, rewardId: reward.id, slotKey },
      });
      if (existing) throw new ConflictException('Ya adquiriste el punto extra para este trimestre');
      return transaction.userReward.create({
        data: {
          userId,
          rewardId: reward.id,
          redemptionId,
          slotKey,
          status: UserRewardStatus.AVAILABLE,
          metadata: { trimester: dto.trimester },
        },
      });
    }

    if (reward.type === RewardType.SMART_HINT) {
      const slotKey = 'smart-hint';
      const existing = await transaction.userReward.findFirst({
        where: { userId, rewardId: reward.id, slotKey, status: UserRewardStatus.AVAILABLE },
      });
      if (existing?.status === UserRewardStatus.AVAILABLE) {
        throw new ConflictException('Usá tu pista inteligente antes de canjear otra');
      }
      return transaction.userReward.create({
        data: {
          userId,
          rewardId: reward.id,
          redemptionId,
          slotKey,
          status: UserRewardStatus.AVAILABLE,
          metadata: {},
        },
      });
    }

    const slotKey = 'double-xp';
    const existing = await transaction.userReward.findFirst({
      where: {
        userId,
        rewardId: reward.id,
        slotKey,
        status: UserRewardStatus.ACTIVE,
        expiresAt: { gt: now },
      },
    });
    if (
      existing?.status === UserRewardStatus.ACTIVE &&
      existing.expiresAt &&
      existing.expiresAt > now
    ) {
      throw new ConflictException('Ya tenés Doble XP activo');
    }
    const durationHours = Number(getMetadata(reward.metadata).durationHours) || 24;
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    await transaction.userReward.updateMany({
      where: {
        userId,
        rewardId: reward.id,
        slotKey,
        status: UserRewardStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      data: { status: UserRewardStatus.EXPIRED },
    });
    return transaction.userReward.create({
      data: {
        userId,
        rewardId: reward.id,
        redemptionId,
        slotKey,
        status: UserRewardStatus.ACTIVE,
        activatedAt: now,
        expiresAt,
        metadata: {},
      },
    });
  }

  private async validateRedemption(
    transaction: Prisma.TransactionClient,
    userId: string,
    reward: Reward,
    dto: RedeemRewardDto,
  ) {
    const now = new Date();
    if (reward.type === RewardType.EXAM_BONUS_POINT) {
      if (!dto.trimester)
        throw new ForbiddenException('Elegí el trimestre para aplicar el punto extra');
      const existing = await transaction.userReward.findFirst({
        where: { userId, rewardId: reward.id, slotKey: `trimester:${dto.trimester}` },
      });
      if (existing) throw new ConflictException('Ya adquiriste el punto extra para este trimestre');
      return;
    }

    if (reward.type === RewardType.SMART_HINT) {
      const availableHint = await transaction.userReward.findFirst({
        where: {
          userId,
          rewardId: reward.id,
          slotKey: 'smart-hint',
          status: UserRewardStatus.AVAILABLE,
        },
      });
      if (availableHint)
        throw new ConflictException('Usá tu pista inteligente antes de canjear otra');
      return;
    }

    const activeDoubleXp = await transaction.userReward.findFirst({
      where: {
        userId,
        rewardId: reward.id,
        slotKey: 'double-xp',
        status: UserRewardStatus.ACTIVE,
        expiresAt: { gt: now },
      },
    });
    if (activeDoubleXp) throw new ConflictException('Ya tenés Doble XP activo');
  }

  private redemptionMetadata(reward: Reward, dto: RedeemRewardDto) {
    return reward.type === RewardType.EXAM_BONUS_POINT ? { trimester: dto.trimester } : {};
  }

  private async redemptionResponse(
    transaction: Prisma.TransactionClient,
    userId: string,
    redemptionId: string,
    entitlement?: UserReward,
  ) {
    const [user, redemption] = await Promise.all([
      transaction.user.findUniqueOrThrow({ where: { id: userId }, select: { gems: true } }),
      transaction.rewardRedemption.findUniqueOrThrow({
        where: { id: redemptionId },
        include: { reward: { select: { name: true, type: true } }, entitlement: true },
      }),
    ]);
    return { gems: user.gems, redemption, entitlement: entitlement ?? redemption.entitlement };
  }

  private effectiveStatus(entitlement: Pick<UserReward, 'status' | 'expiresAt'>, now: Date) {
    if (
      entitlement.status === UserRewardStatus.ACTIVE &&
      entitlement.expiresAt &&
      entitlement.expiresAt <= now
    ) {
      return UserRewardStatus.EXPIRED;
    }
    return entitlement.status;
  }

  private toRewardRedemptionSummary(redemption: {
    id: string;
    status: RewardRedemptionStatus;
    metadata: unknown;
    createdAt: Date;
    reward: { name: string; type: RewardType };
    entitlement: { status: UserRewardStatus; expiresAt: Date | null } | null;
  }) {
    const entitlementStatus = redemption.entitlement
      ? this.effectiveStatus(redemption.entitlement, new Date())
      : null;
    return {
      id: redemption.id,
      rewardName: redemption.reward.name,
      type: redemption.reward.type,
      redemptionStatus: redemption.status,
      entitlementStatus,
      canRevoke:
        redemption.status === RewardRedemptionStatus.COMPLETED &&
        entitlementStatus !== null &&
        entitlementStatus !== UserRewardStatus.USED,
      redeemedAt: redemption.createdAt.toISOString(),
      expiresAt: redemption.entitlement?.expiresAt?.toISOString() ?? null,
      trimester: getTrimester(redemption.metadata),
    };
  }

  private isWriteConflict(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
  }

  private editorMetadata(dto: CreateRewardDto | UpdateRewardDto, imageObjectKey?: string) {
    const metadata: RewardMetadata = {
      visual: dto.visual,
      color: dto.color,
      icon: dto.icon,
      ...(imageObjectKey ? { imageObjectKey } : {}),
    };
    if (dto.type === RewardType.EXAM_BONUS_POINT) metadata.allowedTrimesters = [1, 2, 3];
    if (dto.type === RewardType.SMART_HINT) metadata.maxAvailable = 1;
    if (dto.type === RewardType.DOUBLE_XP) {
      metadata.multiplier = 2;
      metadata.durationHours = dto.durationHours ?? 24;
    }
    return metadata;
  }

  private toAdminReward(reward: Reward & { _count: { redemptions: number } }) {
    const metadata = getMetadata(reward.metadata);
    const visual = metadata.visual;
    return {
      id: reward.id,
      slug: reward.slug,
      name: reward.name,
      description: reward.description,
      category: reward.category,
      cost: reward.cost,
      type: reward.type,
      isActive: reward.isActive,
      visual: visual === 'exam' || visual === 'hint' || visual === 'double-xp' ? visual : 'hint',
      color: this.rewardColor(metadata),
      icon: this.rewardIcon(metadata),
      imageObjectKey: this.imageObjectKey(metadata),
      durationHours:
        typeof metadata.durationHours === 'number' ? metadata.durationHours : undefined,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
      redemptionCount: reward._count.redemptions,
    };
  }

  private rewardColor(metadata: RewardMetadata) {
    const color = metadata.color;
    return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#4f46e5';
  }

  private rewardIcon(metadata: RewardMetadata) {
    const icon = metadata.icon;
    return icon === 'badge-check' ||
      icon === 'book-open-check' ||
      icon === 'calendar-check' ||
      icon === 'circle-gauge' ||
      icon === 'clipboard-check' ||
      icon === 'timer-reset'
      ? icon
      : 'badge-check';
  }

  private imageObjectKey(metadata: RewardMetadata) {
    const imageObjectKey = metadata.imageObjectKey;
    return typeof imageObjectKey === 'string' ? imageObjectKey : undefined;
  }
}
