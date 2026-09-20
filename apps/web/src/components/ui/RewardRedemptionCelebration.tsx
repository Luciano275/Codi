'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DynamicCodiMascot } from '@/components/mascot/DynamicCodiMascot';
import { Check, Gem, X } from '@/components/ui/Icon';

const confetti = [
  { x: -42, y: -70, rotate: -155, color: '#ffbe0b', delay: 0.08, size: 10 },
  { x: -24, y: -108, rotate: 110, color: '#ff5d8f', delay: 0.03, size: 7 },
  { x: 8, y: -86, rotate: -95, color: '#69c507', delay: 0.14, size: 9 },
  { x: 36, y: -105, rotate: 160, color: '#38bdf8', delay: 0.06, size: 8 },
  { x: 55, y: -62, rotate: -130, color: '#a855f7', delay: 0.18, size: 10 },
  { x: -62, y: -38, rotate: 125, color: '#fb923c', delay: 0.12, size: 7 },
  { x: 70, y: -25, rotate: -80, color: '#f43f5e', delay: 0.1, size: 8 },
  { x: -8, y: -130, rotate: 210, color: '#14b8a6', delay: 0.21, size: 7 },
] as const;

export interface RewardRedemptionData {
  name: string;
  description: string;
  gems: number;
  amountPrefix: '+' | '-';
  eyebrow: string;
  glbLabel: string;
}

interface RewardRedemptionCelebrationProps {
  reward: RewardRedemptionData | null;
  onClose: () => void;
}

function ConfettiBurst({ reducedMotion }: { reducedMotion: boolean | null }) {
  if (reducedMotion) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
    >
      {confetti.map((piece, index) => (
        <motion.i
          key={index}
          className="absolute rounded-sm"
          style={{ width: piece.size, height: piece.size * 0.56, backgroundColor: piece.color }}
          initial={{ opacity: 0, scale: 0, x: 0, y: 4, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.15, 0.9, 0.55],
            x: piece.x,
            y: piece.y,
            rotate: piece.rotate,
          }}
          transition={{ duration: 1.45, delay: piece.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function RedemptionMascot({ label }: { label: string }) {
  return (
    <motion.div
      className="relative mx-auto h-48 w-48"
      initial={{ opacity: 0, scale: 0.35, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 16, delay: 0.16 }}
    >
      <DynamicCodiMascot
        animation="Codi_Excited"
        label={`Codi celebra ${label}`}
        className="h-full w-full drop-shadow-[0_13px_0_rgba(38,102,59,0.16)]"
      />
    </motion.div>
  );
}

export function RewardRedemptionCelebration({ reward, onClose }: RewardRedemptionCelebrationProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!reward) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, reward]);

  return (
    <AnimatePresence>
      {reward ? (
        <motion.div
          className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-[#102018]/68 p-4 backdrop-blur-sm"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? {} : { opacity: 0 }}
          onMouseDown={onClose}
          role="presentation"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-redemption-title"
            className="relative w-full max-w-sm overflow-hidden rounded-[2.4rem] border-4 border-white bg-[#fbfff6] px-6 pb-6 pt-7 text-center shadow-[0_14px_0_#4f8e10,0_32px_80px_rgba(0,0,0,0.36)] sm:px-8"
            initial={reducedMotion ? false : { opacity: 0, y: 32, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 23 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,_#d9ff92,_transparent_67%)]"
            />
            <ConfettiBurst reducedMotion={reducedMotion} />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-white/80 p-2 text-gray-400 shadow-sm transition hover:scale-110 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69c507]"
              aria-label="Cerrar celebración"
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
            <motion.p
              className="relative font-candy-beans text-sm tracking-wide text-[#509600]"
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              {reward.eyebrow}
            </motion.p>
            <RedemptionMascot label={reward.glbLabel} />
            <div className="relative mt-7">
              <h2
                id="reward-redemption-title"
                className="font-super-pandora text-2xl text-[#203229]"
              >
                ¡La recompensa es tuya!
              </h2>
              <p className="mt-2 font-simply-olive text-sm leading-6 text-gray-600">
                {reward.description}
              </p>
            </div>
            <div className="relative mt-5 flex items-center justify-center gap-2 rounded-2xl border border-[#c9efaa] bg-[#effce3] px-4 py-2.5 text-[#3f7608]">
              <Gem className="h-5 w-5 fill-[#9eea40]" />
              <span className="font-candy-beans text-xl">
                {reward.amountPrefix}
                {reward.gems}
              </span>
              <span className="font-simply-olive text-xs font-bold">gemas</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-b-4 border-[#4c9705] bg-[#69c507] px-5 py-3 font-super-pandora text-sm text-white transition hover:-translate-y-0.5 hover:border-b-[5px] hover:bg-[#74d20a] active:translate-y-1 active:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#386d05]"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              ¡Genial!
            </button>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
