import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaService, Role, User, UserRewardStatus } from '@codi/database';
import { getLevelFromXp } from '@codi/progression';
import { S3Service } from '../s3/s3.service';
import type { RankingRewardSettingDto } from './dto/update-ranking-rewards.dto';

const STUDENTS_PAGE_SIZE = 20;

function getCurrentRewardPeriodStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

type RankingPeriod = 'WEEK' | 'MONTH' | 'ALL_TIME';
type RankingScope = 'GLOBAL' | 'SCHOOL' | 'FRIENDS' | 'COURSE';

const rankingUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarObjectKey: true,
  xp: true,
  gems: true,
  level: true,
  streak: true,
  createdAt: true,
  cmsSource: true,
  _count: { select: { lessonCompletions: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class RankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async getGlobal(page = 1, viewerId: string, period?: string, scope?: string) {
    const rankingPeriod = this.parsePeriod(period);
    const rankingScope = this.parseScope(scope);
    if (rankingPeriod === 'ALL_TIME' && (rankingScope === 'GLOBAL' || rankingScope === 'FRIENDS')) {
      return this.getAllTimeRanking(page, viewerId, rankingScope);
    }
    const [viewer, courseIds, rewards] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: viewerId } }),
      rankingScope === 'COURSE' ? this.findViewerCourseIds(viewerId) : Promise.resolve([]),
      this.getRankingRewards(viewerId),
    ]);
    const users = await this.prisma.user.findMany({
      where: this.getScopeWhere(rankingScope, viewer.cmsSource, viewerId, courseIds),
      select: rankingUserSelect,
    });
    const periodXp = await this.getPeriodXp(
      rankingPeriod,
      users.map((user) => user.id),
    );
    const rankedUsers = users
      .map((user) => ({
        ...user,
        rankingXp: rankingPeriod === 'ALL_TIME' ? user.xp : (periodXp.get(user.id) ?? 0),
      }))
      .sort(
        (left, right) =>
          right.rankingXp - left.rankingXp ||
          right.xp - left.xp ||
          left.createdAt.getTime() - right.createdAt.getTime() ||
          left.id.localeCompare(right.id),
      );
    const totalStudents = rankedUsers.length;
    const currentUserIndex = rankedUsers.findIndex((user) => user.id === viewerId);
    const pageCount = Math.max(1, Math.ceil(totalStudents / STUDENTS_PAGE_SIZE));
    const safePage = Math.min(page, pageCount);
    const pageUsers = rankedUsers.slice(
      (safePage - 1) * STUDENTS_PAGE_SIZE,
      safePage * STUDENTS_PAGE_SIZE,
    );
    const items = await this.serializeRankedUsers(pageUsers, (safePage - 1) * STUDENTS_PAGE_SIZE);
    const podium = await this.serializeRankedUsers(rankedUsers.slice(0, 3));
    const currentUser = currentUserIndex === -1 ? null : rankedUsers[currentUserIndex];
    const nextPlayer = currentUserIndex > 0 ? rankedUsers[currentUserIndex - 1] : null;

    return {
      items,
      podium,
      rewards,
      page: safePage,
      pageSize: STUDENTS_PAGE_SIZE,
      totalStudents,
      totalPages: pageCount,
      currentUser: currentUser
        ? {
            rank: currentUserIndex + 1,
            xp: currentUser.rankingXp,
            totalXp: currentUser.xp,
            level: getLevelFromXp(currentUser.xp),
            completedLessons: currentUser._count.lessonCompletions,
            streak: currentUser.streak,
            xpToNextRank: nextPlayer
              ? Math.max(1, nextPlayer.rankingXp - currentUser.rankingXp + 1)
              : 0,
          }
        : null,
    };
  }

  private async getAllTimeRanking(page: number, viewerId: string, scope: 'GLOBAL' | 'FRIENDS') {
    const where: Prisma.UserWhereInput =
      scope === 'FRIENDS' ? { role: 'STUDENT', id: viewerId } : { role: 'STUDENT' };
    const [totalStudents, users, podiumUsers, currentUser, rewards] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * STUDENTS_PAGE_SIZE,
        take: STUDENTS_PAGE_SIZE,
        select: rankingUserSelect,
      }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        take: 3,
        select: rankingUserSelect,
      }),
      this.prisma.user.findFirst({ where: { ...where, id: viewerId }, select: rankingUserSelect }),
      this.getRankingRewards(viewerId),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalStudents / STUDENTS_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const [currentRank, nextPlayer] = currentUser
      ? await Promise.all([
          this.prisma.user
            .count({
              where: {
                ...where,
                OR: [
                  { xp: { gt: currentUser.xp } },
                  { xp: currentUser.xp, createdAt: { lt: currentUser.createdAt } },
                  {
                    xp: currentUser.xp,
                    createdAt: currentUser.createdAt,
                    id: { lt: currentUser.id },
                  },
                ],
              },
            })
            .then((rankedStudents) => rankedStudents + 1),
          this.prisma.user.findFirst({
            where: {
              ...where,
              OR: [
                { xp: { gt: currentUser.xp } },
                { xp: currentUser.xp, createdAt: { lt: currentUser.createdAt } },
                {
                  xp: currentUser.xp,
                  createdAt: currentUser.createdAt,
                  id: { lt: currentUser.id },
                },
              ],
            },
            orderBy: [{ xp: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
            select: { xp: true },
          }),
        ])
      : [null, null];
    const items = await this.serializeRankedUsers(
      users.map((user) => ({ ...user, rankingXp: user.xp })),
      (safePage - 1) * STUDENTS_PAGE_SIZE,
    );
    const podium = await this.serializeRankedUsers(
      podiumUsers.map((user) => ({ ...user, rankingXp: user.xp })),
    );
    return {
      items,
      podium,
      rewards,
      page: safePage,
      pageSize: STUDENTS_PAGE_SIZE,
      totalStudents,
      totalPages,
      currentUser:
        currentUser && currentRank
          ? {
              rank: currentRank,
              xp: currentUser.xp,
              totalXp: currentUser.xp,
              level: getLevelFromXp(currentUser.xp),
              completedLessons: currentUser._count.lessonCompletions,
              streak: currentUser.streak,
              xpToNextRank: nextPlayer ? Math.max(1, nextPlayer.xp - currentUser.xp + 1) : 0,
            }
          : null,
    };
  }

  async getRankingRewards(viewerId?: string) {
    const rewards = await this.prisma.rankingReward.findMany({
      orderBy: { position: 'asc' },
      select: { position: true, title: true, gems: true },
    });
    if (!viewerId) return rewards;

    const claims = await this.prisma.rankingRewardClaim.findMany({
      where: { userId: viewerId, periodStart: getCurrentRewardPeriodStart() },
      select: { rankingReward: { select: { position: true } } },
    });
    const claimedPositions = new Set(claims.map((claim) => claim.rankingReward.position));

    return rewards.map((reward) => ({ ...reward, claimed: claimedPositions.has(reward.position) }));
  }

  async claimCurrentPodiumReward(user: User) {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException('Solo los estudiantes pueden reclamar recompensas del podio.');
    }

    const periodStart = getCurrentRewardPeriodStart();

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const podium = await transaction.user.findMany({
          where: { role: Role.STUDENT },
          orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
          take: 3,
          select: { id: true },
        });
        const position = podium.findIndex((student) => student.id === user.id) + 1;
        if (position === 0) {
          throw new BadRequestException('Tu posición actual no tiene una recompensa disponible.');
        }

        const reward = await transaction.rankingReward.findUnique({ where: { position } });
        if (!reward) {
          throw new BadRequestException('La recompensa de tu puesto todavía no está configurada.');
        }

        await transaction.rankingRewardClaim.create({
          data: {
            userId: user.id,
            rankingRewardId: reward.id,
            gemsAwarded: reward.gems,
            periodStart,
          },
        });
        const updatedUser = await transaction.user.update({
          where: { id: user.id },
          data: { gems: { increment: reward.gems } },
          select: { gems: true },
        });

        return {
          reward: { position: reward.position, title: reward.title, gems: reward.gems },
          gems: updatedUser.gems,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Esta recompensa ya fue reclamada.');
      }
      throw error;
    }
  }

  async updateRankingRewards(rewards: RankingRewardSettingDto[]) {
    const positions = new Set(rewards.map((reward) => reward.position));
    if (positions.size !== 3 || ![1, 2, 3].every((position) => positions.has(position))) {
      throw new BadRequestException(
        'Configurá exactamente las recompensas de los puestos 1, 2 y 3.',
      );
    }
    await this.prisma.$transaction(
      rewards.map((reward) =>
        this.prisma.rankingReward.upsert({
          where: { position: reward.position },
          create: reward,
          update: { title: reward.title, gems: reward.gems },
        }),
      ),
    );
    return this.getRankingRewards();
  }

  private parsePeriod(period?: string): RankingPeriod {
    return period === 'WEEK' || period === 'MONTH' ? period : 'ALL_TIME';
  }

  private parseScope(scope?: string): RankingScope {
    return scope === 'SCHOOL' || scope === 'FRIENDS' || scope === 'COURSE' ? scope : 'GLOBAL';
  }

  private getScopeWhere(
    scope: RankingScope,
    cmsSource: Prisma.UserWhereInput['cmsSource'],
    viewerId: string,
    courseIds: string[],
  ): Prisma.UserWhereInput {
    if (scope === 'SCHOOL') return { role: 'STUDENT', cmsSource };
    if (scope === 'FRIENDS') return { role: 'STUDENT', id: viewerId };
    if (scope === 'COURSE') {
      return {
        role: 'STUDENT',
        lessonCompletions: {
          some: { lesson: { module: { courseId: { in: courseIds } } } },
        },
      };
    }
    return { role: 'STUDENT' };
  }

  private async serializeRankedUsers(
    users: Array<
      Prisma.UserGetPayload<{ select: typeof rankingUserSelect }> & { rankingXp: number }
    >,
    rankOffset = 0,
  ) {
    return Promise.all(
      users.map(async (user, index) => {
        const avatar = await this.s3.signedResource(user.avatarObjectKey, null, null);
        const {
          avatarObjectKey,
          createdAt: _createdAt,
          cmsSource: _cmsSource,
          _count,
          rankingXp,
          ...profile
        } = user;
        return {
          rank: rankOffset + index + 1,
          ...profile,
          avatarUrl: avatar?.url ?? null,
          xp: rankingXp,
          totalXp: user.xp,
          completedLessons: _count.lessonCompletions,
          level: getLevelFromXp(user.xp),
        };
      }),
    );
  }

  private async findViewerCourseIds(viewerId: string) {
    const completions = await this.prisma.lessonCompletion.findMany({
      where: { userId: viewerId },
      select: { lesson: { select: { module: { select: { courseId: true } } } } },
    });
    return [...new Set(completions.map((completion) => completion.lesson.module.courseId))];
  }

  private async getPeriodXp(period: RankingPeriod, userIds: string[]) {
    if (period === 'ALL_TIME') return new Map<string, number>();
    const periodStart = this.getPeriodStart(period);
    if (period === 'WEEK') {
      const weeklyRanking = await this.prisma.weeklyRanking.findMany({
        where: { userId: { in: userIds }, weekStart: { gte: periodStart } },
        select: { userId: true, xpEarned: true },
      });
      return new Map(weeklyRanking.map((entry) => [entry.userId, entry.xpEarned]));
    }
    const [lessonXp, submissionXp] = await Promise.all([
      this.prisma.lessonCompletion.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, completedAt: { gte: periodStart } },
        _sum: { xpAwarded: true },
      }),
      this.prisma.submission.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, submittedAt: { gte: periodStart } },
        _sum: { xpAwarded: true },
      }),
    ]);
    const xpByUserId = new Map<string, number>();
    for (const entry of [...lessonXp, ...submissionXp]) {
      xpByUserId.set(
        entry.userId,
        (xpByUserId.get(entry.userId) ?? 0) + (entry._sum.xpAwarded ?? 0),
      );
    }
    return xpByUserId;
  }

  private getPeriodStart(period: Exclude<RankingPeriod, 'ALL_TIME'>) {
    const now = new Date();
    if (period === 'MONTH') return new Date(now.getFullYear(), now.getMonth(), 1);
    const start = new Date(now);
    const offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    return start;
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
