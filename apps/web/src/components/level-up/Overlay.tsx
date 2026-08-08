'use client';

import { motion } from 'motion/react';

interface OverlayProps {
  reducedMotion: boolean;
}

export function Overlay({ reducedMotion }: OverlayProps) {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.15 : 0.25, ease: 'easeOut' }}
      className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(71,48,10,0.2),rgba(3,5,12,0.72)_72%)] backdrop-blur-[2px]"
    />
  );
}
