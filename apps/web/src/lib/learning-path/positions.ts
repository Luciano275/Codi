export const BASE_DESKTOP = [
  { x: 5, y: 50 },
  { x: 30, y: 38 },
  { x: 45, y: 28 },
  { x: 58, y: 38 },
  { x: 70, y: 50 },
  { x: 58, y: 62 },
  { x: 45, y: 72 },
  { x: 30, y: 62 },
  { x: 45, y: 88 },
  { x: 70, y: 88 },
];

export const BASE_MOBILE = [
  { x: 50, y: 92 },
  { x: 30, y: 82 },
  { x: 50, y: 72 },
  { x: 70, y: 62 },
  { x: 50, y: 52 },
  { x: 30, y: 42 },
  { x: 50, y: 32 },
  { x: 70, y: 22 },
  { x: 50, y: 12 },
  { x: 50, y: 3 },
];

export function extendPositions(base: { x: number; y: number }[], count: number) {
  if (count <= base.length) return base;
  const extra: { x: number; y: number }[] = [];
  const lastY = base[base.length - 1]!.y;
  const yGap = 20;
  const baseX = 5;
  const perRow = 5;
  let rowStart = base.length;

  for (let i = base.length; i < count; i++) {
    const offset = i - rowStart;
    const row = Math.floor(offset / perRow);
    const col = offset % perRow;
    const reversed = row % 2 === 1;
    const xIndex = reversed ? perRow - 1 - col : col;
    const x = baseX + xIndex * 16.25;
    const y = lastY + (row + 1) * yGap;
    extra.push({ x: Math.round(x), y });
  }

  return [...base, ...extra];
}

export function buildPath(positions: { x: number; y: number }[], stageIds: number[]) {
  if (stageIds.length === 0) return '';
  return stageIds
    .map((id, i) => {
      const pos = positions[id - 1];
      if (!pos) return '';
      if (i === 0) return `M ${pos.x} ${pos.y}`;
      const prev = positions[stageIds[i - 1] - 1];
      if (!prev) return '';
      const cx = (prev.x + pos.x) / 2;
      return `C ${cx} ${prev.y}, ${cx} ${pos.y}, ${pos.x} ${pos.y}`;
    })
    .join(' ');
}

export function buildLockedPath(positions: { x: number; y: number }[], startId: number) {
  const ids: number[] = [];
  for (let i = startId; i <= positions.length; i++) {
    ids.push(i);
  }
  return buildPath(positions, ids);
}
