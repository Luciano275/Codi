import { Injectable } from '@nestjs/common';
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
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarObjectKey: true,
        xp: true,
        gems: true,
        level: true,
      },
    });

    return Promise.all(users.map(async (user, index) => {
      const avatar = await this.s3.signedResource(user.avatarObjectKey, null, null);
      const { avatarObjectKey, ...profile } = user;
      return {
        rank: index + 1,
        ...profile,
        avatarUrl: avatar?.url ?? null,
        level: getLevelFromXp(user.xp),
      };
    }));
  }
}
