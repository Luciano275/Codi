'use client';

import type { ReactNode } from 'react';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

interface StatChipProps {
  icon: ReactNode;
  value: number;
  suffix?: string;
  gradient: string;
  label: string;
  animated?: boolean;
  appearance?: 'solid' | 'subtle';
}

const gradientMap: Record<string, string> = {
  amber: 'from-amber-400 to-desierto-500',
  cyan: 'from-cyan-400 to-valle-500',
  purple: 'from-bosque-400 to-bosque-600',
  green: 'from-pradera-400 to-pradera-500',
  blue: 'from-lagos-400 to-lagos-500',
  gold: 'from-castillo-300 to-castillo-500',
  pink: 'from-montana-300 to-montana-500',
};

const subtleMap: Record<string, string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  purple: 'border-bosque-200 bg-bosque-50 text-bosque-700',
  green: 'border-pradera-200 bg-pradera-50 text-pradera-700',
  blue: 'border-lagos-200 bg-lagos-50 text-lagos-700',
  gold: 'border-castillo-200 bg-castillo-50 text-castillo-700',
  pink: 'border-montana-200 bg-montana-50 text-montana-700',
};

export default function StatChip({
  icon,
  value,
  suffix = '',
  gradient,
  label,
  animated = true,
  appearance = 'solid',
}: StatChipProps) {
  const displayValue = animated ? useAnimatedValue(value) : value;
  const gradClass = gradientMap[gradient] || gradient;
  const subtleClass = subtleMap[gradient] || 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <div
      className={
        appearance === 'subtle'
          ? `flex items-center gap-1.5 rounded-xl border px-3 py-1.5 shadow-[0_2px_0_rgba(15,23,42,0.06)] transition-colors duration-200 hover:bg-white ${subtleClass}`
          : `flex items-center gap-1.5 rounded-xl bg-linear-to-br ${gradClass} px-3 py-1.5 shadow-xs transition-all duration-300 hover:shadow-md hover:scale-105`
      }
      role="status"
      aria-label={`${label}: ${displayValue}${suffix}`}
    >
      <span className={appearance === 'subtle' ? '' : 'text-white drop-shadow-xs'}>{icon}</span>
      <span
        className={`font-candy-beans text-sm ${appearance === 'subtle' ? '' : 'text-white drop-shadow-xs'}`}
      >
        {displayValue.toLocaleString()}
        {suffix}
      </span>
    </div>
  );
}
