'use client';

import dynamic from 'next/dynamic';
import type { CodiMascotProps } from './CodiMascot';

const LazyCodiMascot = dynamic(() => import('./CodiMascot').then((module) => module.CodiMascot), {
  ssr: false,
  loading: () => (
    <div aria-hidden className="h-full w-full animate-pulse rounded-full bg-current opacity-5" />
  ),
});

export function DynamicCodiMascot({ className = '', ...props }: CodiMascotProps) {
  return (
    <div className={className}>
      <LazyCodiMascot {...props} className="h-full w-full" />
    </div>
  );
}
