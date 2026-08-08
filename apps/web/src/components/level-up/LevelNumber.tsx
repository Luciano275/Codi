'use client';

import { ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

interface LevelNumberProps {
  previousLevel: number;
  level: number;
  reducedMotion: boolean;
}

export function LevelNumber({ previousLevel, level, reducedMotion }: LevelNumberProps) {
  const delay = reducedMotion ? 0.12 : 0.72;

  return (
    <div className="relative mt-7 flex items-center justify-center gap-3 sm:gap-5">
      <motion.span
        initial={{ opacity: 0, scale: 1 }}
        animate={
          reducedMotion
            ? { opacity: 0.48, scale: 0.72, y: -2 }
            : { opacity: [0, 0.9, 0.48], scale: [1, 1, 0.72], y: [0, 0, -2] }
        }
        transition={{ duration: reducedMotion ? 0.2 : 0.62, delay, ease: 'easeOut' }}
        className="font-super-pandora text-3xl text-amber-100/80 tabular-nums sm:text-5xl"
      >
        {previousLevel}
      </motion.span>

      <motion.span
        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
        animate={{ opacity: 0.8, scale: 1, rotate: -90 }}
        transition={{ duration: 0.3, delay: delay + 0.08 }}
        className="text-amber-300"
      >
        <ArrowDown aria-hidden="true" className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.5} />
      </motion.span>

      <motion.span
        initial={{ opacity: 0, y: reducedMotion ? 8 : 34, scale: 0.5 }}
        animate={
          reducedMotion
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 1, y: [34, -5, 0], scale: [0.5, 1.16, 1] }
        }
        transition={{ duration: reducedMotion ? 0.25 : 0.72, delay, ease: 'easeOut' }}
        className="font-super-pandora text-6xl leading-none text-amber-50 [text-shadow:0_0_14px_rgba(255,237,163,0.9),0_0_36px_rgba(245,158,11,0.75)] sm:text-8xl"
      >
        {level}
      </motion.span>
    </div>
  );
}
