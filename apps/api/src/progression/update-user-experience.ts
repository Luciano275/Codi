import type { Prisma } from '@codi/database';
import { getLevelFromXp } from '@codi/progression';

type UserProgressClient = Pick<Prisma.TransactionClient, 'user'>;

/** Keeps cumulative XP and the denormalized level in sync in the same transaction. */
export async function updateUserExperience(
  client: UserProgressClient,
  userId: string,
  xpDelta: number,
) {
  const updatedUser = await client.user.update({
    where: { id: userId },
    data: { xp: { increment: xpDelta } },
  });
  const normalizedXp = Math.max(0, updatedUser.xp);
  const level = getLevelFromXp(normalizedXp);

  if (normalizedXp === updatedUser.xp && level === updatedUser.level) {
    return updatedUser;
  }

  return client.user.update({
    where: { id: userId },
    data: normalizedXp === updatedUser.xp ? { level } : { xp: normalizedXp, level },
  });
}
