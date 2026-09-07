import { memo } from 'react';
import {
  BadgeCheck,
  BookOpenCheck,
  CalendarCheck2,
  CircleGauge,
  ClipboardCheck,
  TimerReset,
} from 'lucide-react';
import type { RewardIcon } from '@codi/types';

const rewardIcons = {
  'badge-check': BadgeCheck,
  'book-open-check': BookOpenCheck,
  'calendar-check': CalendarCheck2,
  'circle-gauge': CircleGauge,
  'clipboard-check': ClipboardCheck,
  'timer-reset': TimerReset,
} as const;

export const RewardIllustration = memo(function RewardIllustration({
  color,
  icon,
  imageUrl,
  name,
}: {
  color: string;
  icon: RewardIcon;
  imageUrl?: string | { url?: string };
  name: string;
}) {
  const Icon = rewardIcons[icon];
  const source = typeof imageUrl === 'string' ? imageUrl : imageUrl?.url;
  return (
    <div
      className="relative flex h-39 items-center justify-center overflow-hidden rounded-[1.55rem] ring-1 ring-black/5"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${color} 16%, white), color-mix(in srgb, ${color} 5%, white))`,
      }}
    >
      {source ? (
        <img
          src={source}
          alt={name}
          className="h-full w-full object-contain p-2"
          decoding="async"
          loading="lazy"
        />
      ) : (
        <Icon className="h-16 w-16 drop-shadow-sm" style={{ color }} strokeWidth={1.7} />
      )}
    </div>
  );
});
