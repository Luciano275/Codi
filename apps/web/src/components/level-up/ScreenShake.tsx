'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ScreenShakeProps {
  children: ReactNode;
  reducedMotion: boolean;
}

export function ScreenShake({ children, reducedMotion }: ScreenShakeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1 }}
      animate={
        reducedMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              scale: [1, 1.035, 1.03],
              x: [0, -2, 2, -1, 0],
              y: [0, 1, -1, 1, 0],
            }
      }
      exit={{
        opacity: 0,
        scale: reducedMotion ? 1 : 0.985,
        transition: { duration: reducedMotion ? 0.16 : 0.38, ease: 'easeInOut' },
      }}
      transition={
        reducedMotion
          ? { duration: 0.18 }
          : {
              opacity: { duration: 0.25 },
              scale: { duration: 0.6, times: [0, 0.52, 1], ease: 'easeOut' },
              x: { duration: 0.2, delay: 0.62, ease: 'easeInOut' },
              y: { duration: 0.2, delay: 0.62, ease: 'easeInOut' },
            }
      }
      className="pointer-events-none fixed inset-0 z-[200] grid place-items-center overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
