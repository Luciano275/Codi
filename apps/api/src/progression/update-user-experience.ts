import { RewardType, UserRewardStatus, type Prisma } from '@codi/database';
import { getLevelFromXp } from '@codi/progression';

type UserProgressClient = Pick<Prisma.TransactionClient, 'user' | 'userReward'>;

/** Keeps cumulative XP and the denormalized level in sync in the same transaction. */
export async function updateUserExperience(
  client: UserProgressClient,
  userId: string,
  xpDelta: number,
) {
  const multiplier = await getActiveXpMultiplier(client, userId, xpDelta);
  const awardedXp = xpDelta > 0 ? xpDelta * multiplier : xpDelta;
  const updatedUser = await client.user.update({
    where: { id: userId },
    data: { xp: { increment: awardedXp } },
  });
  const normalizedXp = Math.max(0, updatedUser.xp);
  const level = getLevelFromXp(normalizedXp);

  if (normalizedXp === updatedUser.xp && level === updatedUser.level) {
    return { user: updatedUser, xpAwarded: awardedXp };
  }

  const user = await client.user.update({
    where: { id: userId },
    data: normalizedXp === updatedUser.xp ? { level } : { xp: normalizedXp, level },
  });
  return { user, xpAwarded: awardedXp };
}

async function getActiveXpMultiplier(
  client: UserProgressClient,
  userId: string,
  xpDelta: number,
) {
  if (xpDelta <= 0) return 1;
  const reward = await client.userReward.findFirst({
    where: {
      userId,
      status: UserRewardStatus.ACTIVE,
      expiresAt: { gt: new Date() },
      reward: { type: RewardType.DOUBLE_XP },
    },
    include: { reward: { select: { metadata: true } } },
  });
  const metadata = reward?.reward.metadata;
  const multiplier =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? Number((metadata as Record<string, unknown>).multiplier)
      : 1;
  return Number.isFinite(multiplier) && multiplier > 1 ? multiplier : 1;
}
