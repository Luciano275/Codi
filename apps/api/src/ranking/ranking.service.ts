import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, UserRewardStatus } from '@codi/database';
import { getLevelFromXp } from '@codi/progression';
import { S3Service } from '../s3/s3.service';

const STUDENTS_PAGE_SIZE = 20;

@Injectable()
export class RankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async getGlobal(page = 1) {
    const [totalStudents, users] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * STUDENTS_PAGE_SIZE,
        take: STUDENTS_PAGE_SIZE,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarObjectKey: true,
          profileBanner: true,
          xp: true,
          gems: true,
          level: true,
        },
      }),
    ]);

    const items = await Promise.all(
      users.map(async (user, index) => {
        const avatar = await this.s3.signedResource(user.avatarObjectKey, null, null);
        const { avatarObjectKey, ...profile } = user;
        return {
          rank: (page - 1) * STUDENTS_PAGE_SIZE + index + 1,
          ...profile,
          avatarUrl: avatar?.url ?? null,
          level: getLevelFromXp(user.xp),
        };
      }),
    );
    return {
      items,
      page,
      pageSize: STUDENTS_PAGE_SIZE,
      totalStudents,
      totalPages: Math.max(1, Math.ceil(totalStudents / STUDENTS_PAGE_SIZE)),
    };
  }

  async getPlayerProfile(id: string, viewerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarObjectKey: true,
        profileBanner: true,
        xp: true,
        gems: true,
        streak: true,
        createdAt: true,
        role: true,
        achievements: {
          orderBy: { unlockedAt: 'desc' },
          take: 6,
          select: {
            unlockedAt: true,
            achievement: { select: { code: true, title: true, description: true, iconUrl: true } },
          },
        },
        rewardRedemptions: {
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: {
            id: true,
            status: true,
            metadata: true,
            createdAt: true,
            reward: { select: { name: true, type: true } },
            entitlement: { select: { status: true, expiresAt: true } },
          },
        },
      },
    });

    if (!user || (user.role !== 'STUDENT' && user.id !== viewerId)) {
      throw new NotFoundException('Jugador no encontrado');
    }

    const isRanked = user.role === 'STUDENT';

    const [
      higherRanked,
      totalStudents,
      completedLessons,
      acceptedSubmissions,
      totalSubmissions,
      avatar,
    ] = await Promise.all([
      isRanked
        ? this.prisma.user.count({
            where: {
              role: 'STUDENT',
              OR: [
                { xp: { gt: user.xp } },
                { xp: user.xp, createdAt: { lt: user.createdAt } },
                { xp: user.xp, createdAt: user.createdAt, id: { lt: user.id } },
              ],
            },
          })
        : Promise.resolve(0),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.lessonCompletion.count({ where: { userId: id } }),
      this.prisma.submission.count({ where: { userId: id, status: 'ACCEPTED' } }),
      this.prisma.submission.count({ where: { userId: id } }),
      this.s3.signedResource(user.avatarObjectKey, null, null),
    ]);

    const { avatarObjectKey, role: _role, achievements, rewardRedemptions, ...player } = user;
    return {
      ...player,
      level: getLevelFromXp(user.xp),
      avatarUrl: avatar?.url ?? null,
      rank: isRanked ? higherRanked + 1 : null,
      isRanked,
      totalStudents,
      completedLessons,
      acceptedSubmissions,
      totalSubmissions,
      achievements: achievements.map(({ achievement, unlockedAt }) => ({
        ...achievement,
        unlockedAt,
      })),
      rewards: rewardRedemptions.map((redemption) => ({
        id: redemption.id,
        rewardName: redemption.reward.name,
        type: redemption.reward.type,
        redemptionStatus: redemption.status,
        entitlementStatus: this.getEffectiveEntitlementStatus(redemption.entitlement),
        redeemedAt: redemption.createdAt,
        expiresAt: redemption.entitlement?.expiresAt ?? null,
        trimester: this.getTrimester(redemption.metadata),
      })),
    };
  }

  private getTrimester(metadata: unknown) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
    const trimester = (metadata as Record<string, unknown>).trimester;
    return typeof trimester === 'number' ? trimester : undefined;
  }

  private getEffectiveEntitlementStatus(
    entitlement: { status: UserRewardStatus; expiresAt: Date | null } | null,
  ) {
    if (!entitlement) return null;
    if (
      entitlement.status === UserRewardStatus.ACTIVE &&
      entitlement.expiresAt &&
      entitlement.expiresAt <= new Date()
    ) {
      return UserRewardStatus.EXPIRED;
    }
    return entitlement.status;
  }
}
