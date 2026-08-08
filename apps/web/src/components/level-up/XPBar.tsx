'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Zap } from 'lucide-react';
import { LevelUpAnimation } from './LevelUpAnimation';
import { useXPBarSequence } from './useXPBarSequence';

export interface XPBarProps {
  totalXp: number;
  className?: string;
}

export const XPBar = memo(function XPBar({ totalXp, className = '' }: XPBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  const {
    activeSegment,
    completeBarFill,
    completeLevelUp,
    displayProgress,
    levelChange,
    segmentKey,
  } = useXPBarSequence(totalXp, reducedMotion);

  const shownLevel = activeSegment?.level ?? displayProgress.level;
  const shownXp = activeSegment?.endXp ?? displayProgress.xpIntoLevel;
  const shownRequiredXp = activeSegment?.xpToNextLevel ?? displayProgress.xpToNextLevel;
  const startScale = activeSegment
    ? activeSegment.startXp / activeSegment.xpToNextLevel
    : displayProgress.progress;
  const endScale = activeSegment
    ? activeSegment.endXp / activeSegment.xpToNextLevel
    : displayProgress.progress;
  const fillDistance = Math.max(0, endScale - startScale);
  const fillDuration = reducedMotion ? 0.15 : 0.42 + fillDistance * 0.78;

  return (
    <>
      <div
        className={`min-w-32 rounded-xl border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 shadow-xs md:min-w-44 md:px-3 ${className}`}
        title={`${totalXp.toLocaleString('es-AR')} XP acumulados`}
      >
        <div className="mb-1 flex items-center justify-between gap-3 font-simply-olive text-[9px] font-bold uppercase tracking-[0.08em] text-amber-800 md:text-[10px]">
          <span className="flex items-center gap-1">
            <Zap aria-hidden="true" className="h-3 w-3 fill-amber-400 text-amber-500" />
            Nivel {shownLevel}
          </span>
          <span className="tabular-nums text-amber-700">
            {shownXp.toLocaleString('es-AR')}/{shownRequiredXp.toLocaleString('es-AR')}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={`Progreso de experiencia del nivel ${shownLevel}`}
          aria-valuemin={0}
          aria-valuemax={shownRequiredXp}
          aria-valuenow={shownXp}
          className="relative h-2 overflow-hidden rounded-full bg-amber-200/70 shadow-inner md:h-2.5"
        >
          <motion.div
            key={segmentKey}
            initial={{ scaleX: startScale }}
            animate={{ scaleX: endScale }}
            onAnimationComplete={activeSegment ? completeBarFill : undefined}
            transition={{ duration: fillDuration, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 origin-left rounded-full bg-linear-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_9px_rgba(245,158,11,0.72)] will-change-transform"
          >
            <motion.span
              aria-hidden="true"
              animate={reducedMotion ? undefined : { x: ['-130%', '260%'] }}
              transition={{ duration: 1.25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-y-0 w-1/3 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/75 to-transparent"
            />
          </motion.div>
        </div>
      </div>

      {levelChange ? (
        <LevelUpAnimation
          previousLevel={levelChange.previousLevel}
          level={levelChange.level}
          onComplete={completeLevelUp}
        />
      ) : null}
    </>
  );
});
