'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Gem, X, Zap } from 'lucide-react';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { RewardBurst } from './RewardBurst';

type RewardKind = 'xp' | 'gems';

export interface RewardData {
  kind: RewardKind;
  amount: number;
  title: string;
  detail: string;
}

interface RewardCelebrationProps {
  reward: RewardData | null;
  onDismiss: () => void;
  autoCloseMs?: number;
}

const REWARD_STYLES: Record<
  RewardKind,
  {
    label: string;
    suffix: string;
    icon: typeof Zap;
    card: string;
    iconClass: string;
    ink: string;
    accent: string;
  }
> = {
  xp: {
    label: 'Experiencia obtenida',
    suffix: 'XP',
    icon: Zap,
    card: 'border-desierto-300/80 from-desierto-50 via-castillo-50 to-white shadow-desierto-500/25',
    iconClass: 'from-desierto-400 to-castillo-400 shadow-desierto-500/40',
    ink: 'text-desierto-800',
    accent: 'text-desierto-600',
  },
  gems: {
    label: 'Gemas obtenidas',
    suffix: 'Gemas',
    icon: Gem,
    card: 'border-valle-300/80 from-lagos-50 via-valle-50 to-white shadow-lagos-500/25',
    iconClass: 'from-lagos-500 to-valle-400 shadow-lagos-500/40',
    ink: 'text-lagos-800',
    accent: 'text-lagos-600',
  },
};

function RewardAmount({
  amount,
  suffix,
  reducedMotion,
}: {
  amount: number;
  suffix: string;
  reducedMotion: boolean | null;
}) {
  const displayedAmount = useAnimatedValue(amount, reducedMotion ? 1 : 900, 0);

  return (
    <motion.p
      initial={{ opacity: 0, y: 18, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 16, delay: reducedMotion ? 0 : 0.46 }}
      className="font-super-pandora text-4xl sm:text-5xl"
    >
      +{displayedAmount.toLocaleString('es-AR')}{' '}
      <span className="text-2xl sm:text-3xl">{suffix}</span>
    </motion.p>
  );
}

export function RewardCelebration({
  reward,
  onDismiss,
  autoCloseMs = 4800,
}: RewardCelebrationProps) {
  const reducedMotion = useReducedMotion();
  const onDismissRef = useRef(onDismiss);
  const rewardKey = reward
    ? `${reward.kind}-${reward.amount}-${reward.title}-${reward.detail}`
    : null;

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!rewardKey) return;

    const timeout = window.setTimeout(() => onDismissRef.current(), autoCloseMs);
    return () => window.clearTimeout(timeout);
  }, [rewardKey, autoCloseMs]);

  return (
    <AnimatePresence>
      {reward && (
        <RewardCelebrationCard
          key={rewardKey}
          reward={reward}
          onDismiss={onDismiss}
          reducedMotion={reducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

function RewardCelebrationCard({
  reward,
  onDismiss,
  reducedMotion,
}: {
  reward: RewardData;
  onDismiss: () => void;
  reducedMotion: boolean | null;
}) {
  const style = REWARD_STYLES[reward.kind];
  const Icon = style.icon;

  return (
    <motion.section
      key={`${reward.kind}-${reward.amount}-${reward.title}`}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, scale: 0.45, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -18 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className="fixed left-1/2 top-1/2 z-[100] w-[min(25rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2"
    >
      <div
        className={`relative isolate overflow-visible rounded-[2rem] border-2 bg-gradient-to-br px-5 pb-5 pt-4 text-center shadow-2xl sm:px-7 sm:pb-6 ${style.card}`}
      >
        <RewardBurst kind={reward.kind} reducedMotion={reducedMotion} />

        <button
          type="button"
          onClick={onDismiss}
          className={`absolute right-3 top-3 z-10 rounded-full p-1.5 ${style.accent} transition-colors hover:bg-white/70 focus-visible:bg-white/70`}
          aria-label="Cerrar recompensa"
        >
          <X className="h-4 w-4" />
        </button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : 0.2 }}
          className={`relative mx-auto flex w-fit items-center gap-1.5 rounded-full border border-current/15 bg-white/75 px-3 py-1 font-simply-olive text-[10px] font-bold uppercase ${style.accent}`}
        >
          <Gem className="h-3.5 w-3.5" />
          Recompensa desbloqueada
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.2, rotate: -28 }}
          animate={
            reducedMotion
              ? { opacity: 1, scale: 1, rotate: 0 }
              : { opacity: 1, scale: [0.2, 1.22, 0.94, 1], rotate: [-28, 12, -4, 0] }
          }
          transition={{
            duration: reducedMotion ? 0.01 : 0.75,
            delay: reducedMotion ? 0 : 0.1,
            ease: 'easeOut',
          }}
          className={`relative mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-gradient-to-br text-white shadow-xl ${style.iconClass}`}
        >
          <Icon className="h-10 w-10 fill-white/20 drop-shadow-md" strokeWidth={2.4} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.34 }}
          className={`relative mt-4 ${style.ink}`}
        >
          <p className="font-simply-olive text-xs font-bold uppercase opacity-65">{style.label}</p>
          <RewardAmount
            amount={reward.amount}
            suffix={style.suffix}
            reducedMotion={reducedMotion}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : 0.66 }}
          className="relative mt-3 border-t border-current/10 pt-3"
        >
          <p className={`font-super-pandora text-base ${style.ink}`}>{reward.title}</p>
          <p className="mt-0.5 font-simply-olive text-xs text-gray-500">{reward.detail}</p>
        </motion.div>
      </div>
    </motion.section>
  );
}
