export const DEFAULT_XP_CURVE = {
  baseXp: 500,
  growthFactor: 1.15,
} as const;

export interface XpCurve {
  baseXp: number;
  growthFactor: number;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  progress: number;
}

export interface XpAnimationSegment {
  level: number;
  startXp: number;
  endXp: number;
  xpToNextLevel: number;
  levelUpTo: number | null;
  totalXpAfterSegment: number;
}

function assertValidCurve(curve: XpCurve) {
  if (!Number.isFinite(curve.baseXp) || curve.baseXp <= 0) {
    throw new RangeError('baseXp must be a positive number');
  }

  if (!Number.isFinite(curve.growthFactor) || curve.growthFactor < 1) {
    throw new RangeError('growthFactor must be greater than or equal to 1');
  }
}

function normalizeTotalXp(totalXp: number) {
  if (!Number.isFinite(totalXp)) return 0;
  return Math.max(0, Math.floor(totalXp));
}

/** XP required to advance from `level` to `level + 1`. */
export function getXpForLevel(level: number, curve: XpCurve = DEFAULT_XP_CURVE) {
  assertValidCurve(curve);
  const normalizedLevel = Math.max(1, Math.floor(level));
  return Math.ceil(curve.baseXp * curve.growthFactor ** (normalizedLevel - 1));
}

/** Resolves a cumulative XP value without discarding overflow between levels. */
export function getLevelProgress(
  totalXp: number,
  curve: XpCurve = DEFAULT_XP_CURVE,
): LevelProgress {
  let level = 1;
  let xpIntoLevel = normalizeTotalXp(totalXp);
  let xpToNextLevel = getXpForLevel(level, curve);

  while (xpIntoLevel >= xpToNextLevel) {
    xpIntoLevel -= xpToNextLevel;
    level += 1;
    xpToNextLevel = getXpForLevel(level, curve);
  }

  return {
    level,
    xpIntoLevel,
    xpToNextLevel,
    progress: xpIntoLevel / xpToNextLevel,
  };
}

export function getLevelFromXp(totalXp: number, curve?: XpCurve) {
  return getLevelProgress(totalXp, curve).level;
}

/** Builds the fill/reset phases used by XP bars for one or many consecutive level-ups. */
export function buildXpAnimationSegments(
  previousTotalXp: number,
  totalXp: number,
  curve: XpCurve = DEFAULT_XP_CURVE,
): XpAnimationSegment[] {
  const startTotalXp = normalizeTotalXp(previousTotalXp);
  const targetTotalXp = normalizeTotalXp(totalXp);
  if (targetTotalXp <= startTotalXp) return [];

  const segments: XpAnimationSegment[] = [];
  const startingProgress = getLevelProgress(startTotalXp, curve);
  let level = startingProgress.level;
  let xpIntoLevel = startingProgress.xpIntoLevel;
  let consumedTotalXp = startTotalXp;
  let remainingXp = targetTotalXp - startTotalXp;

  while (remainingXp > 0) {
    const xpToNextLevel = getXpForLevel(level, curve);
    const xpUntilLevelUp = xpToNextLevel - xpIntoLevel;
    const xpInSegment = Math.min(remainingXp, xpUntilLevelUp);
    const endXp = xpIntoLevel + xpInSegment;
    const levelUpTo = endXp === xpToNextLevel ? level + 1 : null;

    consumedTotalXp += xpInSegment;
    segments.push({
      level,
      startXp: xpIntoLevel,
      endXp,
      xpToNextLevel,
      levelUpTo,
      totalXpAfterSegment: consumedTotalXp,
    });

    remainingXp -= xpInSegment;
    if (levelUpTo) {
      level = levelUpTo;
      xpIntoLevel = 0;
    } else {
      xpIntoLevel = endXp;
    }
  }

  return segments;
}
