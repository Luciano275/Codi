'use client';

import { motion } from 'motion/react';

interface EnergyRingProps {
  reducedMotion: boolean;
}

export function EnergyRing({ reducedMotion }: EnergyRingProps) {
  if (reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 grid place-items-center"
    >
      {[0, 0.16].map((delay) => (
        <motion.div
          key={delay}
          initial={{ opacity: 0, scale: 0.18 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.18, 1.15, 1.7] }}
          transition={{ duration: 1.05, delay: 0.38 + delay, ease: 'easeOut' }}
          className="absolute aspect-square w-[min(25rem,76vw)] rounded-full border border-amber-200/80 shadow-[0_0_24px_rgba(251,191,36,0.55),inset_0_0_20px_rgba(255,246,186,0.28)]"
        />
      ))}
    </div>
  );
}
