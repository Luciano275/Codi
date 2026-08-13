import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { getLevelFromXp } from '@codi/progression';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class RankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async getGlobal(limit = 50) {
    const users = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
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
    });

    return Promise.all(
      users.map(async (user, index) => {
        const avatar = await this.s3.signedResource(user.avatarObjectKey, null, null);
        const { avatarObjectKey, ...profile } = user;
        return {
          rank: index + 1,
          ...profile,
          avatarUrl: avatar?.url ?? null,
          level: getLevelFromXp(user.xp),
        };
      }),
    );
  }

  async getPlayerProfile(id: string) {
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
      },
    });

    if (!user || user.role !== 'STUDENT') throw new NotFoundException('Jugador no encontrado');

    const [
      higherRanked,
      totalStudents,
      completedLessons,
      acceptedSubmissions,
      totalSubmissions,
      avatar,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: 'STUDENT',
          OR: [
            { xp: { gt: user.xp } },
            { xp: user.xp, createdAt: { lt: user.createdAt } },
            { xp: user.xp, createdAt: user.createdAt, id: { lt: user.id } },
          ],
        },
      }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.lessonCompletion.count({ where: { userId: id } }),
      this.prisma.submission.count({ where: { userId: id, status: 'ACCEPTED' } }),
      this.prisma.submission.count({ where: { userId: id } }),
      this.s3.signedResource(user.avatarObjectKey, null, null),
    ]);

    const { avatarObjectKey, role: _role, achievements, ...player } = user;
    return {
      ...player,
      level: getLevelFromXp(user.xp),
      avatarUrl: avatar?.url ?? null,
      rank: higherRanked + 1,
      totalStudents,
      completedLessons,
      acceptedSubmissions,
      totalSubmissions,
      achievements: achievements.map(({ achievement, unlockedAt }) => ({
        ...achievement,
        unlockedAt,
      })),
    };
  }
}
