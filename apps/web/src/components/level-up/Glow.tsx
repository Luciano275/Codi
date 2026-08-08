'use client';

import { motion } from 'motion/react';

interface GlowProps {
  reducedMotion: boolean;
}

export function Glow({ reducedMotion }: GlowProps) {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.45 }}
      animate={
        reducedMotion
          ? { opacity: 0.72, scale: 1 }
          : { opacity: [0, 0.95, 0.65, 0.85], scale: [0.45, 1.08, 0.96, 1.02] }
      }
      transition={{
        duration: reducedMotion ? 0.25 : 1.65,
        delay: reducedMotion ? 0.08 : 0.28,
        ease: 'easeOut',
      }}
      className="absolute left-1/2 top-1/2 aspect-square w-[min(46rem,115vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,245,181,0.88)_0%,rgba(251,191,36,0.38)_24%,rgba(245,158,11,0.12)_48%,transparent_70%)] blur-sm"
    />
  );
}
