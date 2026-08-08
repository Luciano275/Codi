'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { EnergyRing } from './EnergyRing';
import { Glow } from './Glow';
import { LevelNumber } from './LevelNumber';
import { Overlay } from './Overlay';
import { Particles } from './Particles';
import { ScreenShake } from './ScreenShake';

export interface LevelUpAnimationProps {
  previousLevel: number;
  level: number;
  onComplete: () => void;
}

export function LevelUpAnimation({ previousLevel, level, onComplete }: LevelUpAnimationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  const [visible, setVisible] = useState(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), reducedMotion ? 1250 : 2850);
    return () => window.clearTimeout(timeout);
  }, [reducedMotion]);

  if (level <= previousLevel) return null;

  return (
    <AnimatePresence onExitComplete={() => onCompleteRef.current()}>
      {visible ? (
        <ScreenShake key={`${previousLevel}-${level}`} reducedMotion={reducedMotion}>
          <Overlay reducedMotion={reducedMotion} />
          <motion.section
            role="status"
            aria-live="assertive"
            aria-atomic="true"
            className="pointer-events-none relative isolate flex w-full max-w-4xl flex-col items-center px-5 text-center"
          >
            <span className="sr-only">
              Subiste del nivel {previousLevel} al nivel {level}.
            </span>
            <div aria-hidden="true" className="relative flex w-full flex-col items-center">
              <Glow reducedMotion={reducedMotion} />
              <EnergyRing reducedMotion={reducedMotion} />
              <Particles reducedMotion={reducedMotion} />

              <motion.p
                initial={{ opacity: 0, y: reducedMotion ? 8 : 24, scale: 0.72 }}
                animate={
                  reducedMotion
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 1, y: [24, -6, 0], scale: [0.72, 1.08, 1] }
                }
                transition={{
                  duration: reducedMotion ? 0.28 : 0.72,
                  delay: reducedMotion ? 0.08 : 0.38,
                  ease: 'easeOut',
                }}
                className="relative font-super-pandora text-[clamp(2.6rem,10vw,7.5rem)] font-bold leading-[0.86] tracking-[-0.055em] text-amber-50 [text-shadow:0_0_10px_rgba(255,255,220,0.95),0_0_34px_rgba(251,191,36,0.88),0_4px_0_rgba(120,70,8,0.45)]"
              >
                ¡SUBISTE DE NIVEL!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={{ opacity: [0, 1, 0.72], scaleX: 1 }}
                transition={{ duration: reducedMotion ? 0.25 : 0.65, delay: 0.5 }}
                className="relative mt-5 h-px w-[min(28rem,72vw)] origin-center bg-linear-to-r from-transparent via-amber-100 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.95)]"
              />

              <LevelNumber
                previousLevel={previousLevel}
                level={level}
                reducedMotion={reducedMotion}
              />

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.72, y: 0 }}
                transition={{ delay: reducedMotion ? 0.3 : 1.18, duration: 0.35 }}
                className="mt-5 font-simply-olive text-xs font-semibold uppercase tracking-[0.32em] text-amber-100 sm:text-sm"
              >
                Tu aventura continúa
              </motion.p>
            </div>
          </motion.section>
        </ScreenShake>
      ) : null}
    </AnimatePresence>
  );
}
