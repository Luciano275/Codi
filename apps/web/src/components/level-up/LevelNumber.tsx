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
    <div className="relative z-10 mt-8 flex items-center justify-center gap-4 sm:mt-10 sm:gap-7">
      <motion.span
        initial={{ opacity: 0, scale: 1 }}
        animate={
          reducedMotion
            ? { opacity: 0.48, scale: 0.72, y: -2 }
            : { opacity: [0, 0.9, 0.48], scale: [1, 1, 0.72], y: [0, 0, -2] }
        }
        transition={{ duration: reducedMotion ? 0.2 : 0.62, delay, ease: 'easeOut' }}
        className="font-super-pandora text-4xl text-amber-100/80 tabular-nums [text-shadow:0_3px_0_rgba(69,38,3,0.8)] sm:text-6xl"
      >
        {previousLevel}
      </motion.span>

      <motion.span
        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
        animate={{ opacity: 0.8, scale: 1, rotate: -90 }}
        transition={{ duration: 0.3, delay: delay + 0.08 }}
        className="rounded-full border border-amber-200/40 bg-amber-100/10 p-1.5 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.22)] sm:p-2"
      >
        <ArrowDown aria-hidden="true" className="h-6 w-6 sm:h-9 sm:w-9" strokeWidth={1.5} />
      </motion.span>

      <motion.span
        initial={{ opacity: 0, y: reducedMotion ? 8 : 34, scale: 0.5 }}
        animate={
          reducedMotion
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 1, y: [34, -5, 0], scale: [0.5, 1.16, 1] }
        }
        transition={{ duration: reducedMotion ? 0.25 : 0.72, delay, ease: 'easeOut' }}
        className="font-super-pandora text-7xl leading-none text-amber-50 [text-shadow:0_0_14px_rgba(255,237,163,0.9),0_0_36px_rgba(245,158,11,0.75),0_5px_0_rgba(89,48,3,0.8)] sm:text-9xl"
      >
        {level}
      </motion.span>
    </div>
  );
}
