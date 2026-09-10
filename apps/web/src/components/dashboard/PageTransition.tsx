'use client';

import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  animateTransform?: boolean;
}

export default function PageTransition({ children, animateTransform = true }: PageTransitionProps) {
  const initial = animateTransform ? { opacity: 0, y: 20 } : { opacity: 0 };
  const animate = animateTransform ? { opacity: 1, y: 0 } : { opacity: 1 };

  return (
    <motion.div
      className="h-full flex-1"
      initial={initial}
      animate={animate}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
