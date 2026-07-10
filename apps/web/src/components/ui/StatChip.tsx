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

export default function StatChip({ icon, value, suffix = '', gradient, label, animated = true }: StatChipProps) {
  const displayValue = animated ? useAnimatedValue(value) : value;
  const gradClass = gradientMap[gradient] || gradient;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl bg-linear-to-br ${gradClass} px-3 py-1.5 shadow-xs transition-all duration-300 hover:shadow-md hover:scale-105`}
      role="status"
      aria-label={`${label}: ${displayValue}${suffix}`}
    >
      <span className="text-white drop-shadow-xs">{icon}</span>
      <span className="font-candy-beans text-sm text-white drop-shadow-xs">
        {displayValue.toLocaleString()}{suffix}
      </span>
    </div>
  );
}
