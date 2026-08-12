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
            className="pointer-events-none relative isolate flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-8"
          >
            <span className="sr-only">
              Subiste del nivel {previousLevel} al nivel {level}.
            </span>
            <div
              aria-hidden="true"
              className="relative flex min-h-[23rem] w-full max-w-5xl flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-amber-200/90 bg-[linear-gradient(135deg,rgba(74,41,5,0.98),rgba(21,17,8,0.98)_42%,rgba(83,49,7,0.98))] px-5 py-10 shadow-[0_0_0_4px_rgba(120,70,8,0.5),0_0_36px_rgba(251,191,36,0.76),0_0_100px_rgba(245,158,11,0.3),inset_0_0_48px_rgba(251,191,36,0.12)] sm:min-h-[31rem] sm:px-12 sm:py-14"
            >
              <div className="absolute inset-[0.4rem] rounded-[1.55rem] border border-amber-100/35" />
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,232,161,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,232,161,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-amber-100 to-transparent shadow-[0_0_18px_rgba(254,243,199,0.95)]" />
              <div className="absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-amber-100/90 sm:left-8 sm:top-8 sm:h-12 sm:w-12" />
              <div className="absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-amber-100/90 sm:right-8 sm:top-8 sm:h-12 sm:w-12" />
              <div className="absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-amber-100/70 sm:bottom-8 sm:left-8 sm:h-12 sm:w-12" />
              <div className="absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-amber-100/70 sm:bottom-8 sm:right-8 sm:h-12 sm:w-12" />

              <Glow reducedMotion={reducedMotion} />
              <EnergyRing reducedMotion={reducedMotion} />
              <Particles reducedMotion={reducedMotion} />

              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0.2 : 0.38, delay: 0.12 }}
                className="relative z-10 mb-5 flex items-center gap-3 font-simply-olive text-[9px] font-bold uppercase tracking-[0.32em] text-amber-100/80 sm:mb-7 sm:text-xs"
              >
                <span className="h-px w-8 bg-amber-200/70 sm:w-14" />
                Recompensa desbloqueada
                <span className="h-px w-8 bg-amber-200/70 sm:w-14" />
              </motion.div>

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
                className="relative z-10 font-super-pandora text-[clamp(3rem,10vw,8.5rem)] font-bold leading-[0.86] tracking-[-0.055em] text-amber-50 [text-shadow:0_0_10px_rgba(255,255,220,0.95),0_0_34px_rgba(251,191,36,0.88),0_5px_0_rgba(89,48,3,0.8),0_9px_0_rgba(42,24,3,0.7)]"
              >
                ¡SUBISTE DE NIVEL!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={{ opacity: [0, 1, 0.72], scaleX: 1 }}
                transition={{ duration: reducedMotion ? 0.25 : 0.65, delay: 0.5 }}
                className="relative z-10 mt-6 h-px w-[min(36rem,72vw)] origin-center bg-linear-to-r from-transparent via-amber-100 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.95)]"
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
                className="relative z-10 mt-7 rounded-full border border-amber-100/35 bg-amber-100/10 px-4 py-1.5 font-simply-olive text-[10px] font-bold uppercase tracking-[0.26em] text-amber-100 shadow-[inset_0_0_16px_rgba(251,191,36,0.12)] sm:text-xs"
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
