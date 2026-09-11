'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Lightbulb, Sparkles, X } from '@/components/ui/Icon';

interface SmartHintCelebrationProps {
  open: boolean;
  onClose: () => void;
}

const sparkles = [
  { x: -82, y: -54, rotate: -110, color: '#ffbf20', delay: 0.02 },
  { x: -42, y: -112, rotate: 85, color: '#fb7185', delay: 0.16 },
  { x: 16, y: -126, rotate: -50, color: '#60a5fa', delay: 0.08 },
  { x: 74, y: -65, rotate: 120, color: '#a3e635', delay: 0.2 },
  { x: 88, y: -22, rotate: -145, color: '#c084fc', delay: 0.12 },
  { x: -92, y: -8, rotate: 110, color: '#fb923c', delay: 0.24 },
] as const;

function HintGlbFallback() {
  return (
    <motion.div
      className="relative mx-auto grid h-40 w-40 place-items-center rounded-[2.35rem] border-4 border-white/75 bg-linear-to-br from-[#fff2a8] via-[#fffdf0] to-[#d9f9a9] shadow-[0_12px_0_#dde9a6,0_25px_36px_rgba(108,86,0,0.2)]"
      initial={{ opacity: 0, scale: 0.4, rotate: 8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 330, damping: 17, delay: 0.16 }}
    >
      <span className="absolute inset-3 rounded-[1.9rem] border-2 border-dashed border-[#d6a700]/45" />
      <span className="relative grid h-20 w-20 place-items-center rounded-[1.5rem] bg-white text-[#e0a600] shadow-lg">
        <Lightbulb className="h-10 w-10 fill-[#ffeb75]" strokeWidth={2.2} />
      </span>
      <span className="absolute -bottom-3 rounded-full bg-[#523f00] px-3 py-1 font-candy-beans text-[10px] tracking-wide text-white shadow-md">
        PISTA 3D
      </span>
    </motion.div>
  );
}

export function SmartHintCelebration({ open, onClose }: SmartHintCelebrationProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] grid place-items-center bg-[#251d00]/68 p-4 backdrop-blur-sm"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? {} : { opacity: 0 }}
          onMouseDown={onClose}
          role="presentation"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="smart-hint-celebration-title"
            className="relative w-full max-w-sm overflow-hidden rounded-[2.4rem] border-4 border-white bg-[#fffdf4] px-6 pb-6 pt-7 text-center shadow-[0_14px_0_#c79d00,0_32px_80px_rgba(0,0,0,0.38)] sm:px-8"
            initial={reducedMotion ? false : { opacity: 0, y: 32, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 23 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,_#fff19a,_transparent_67%)]"
            />
            {!reducedMotion && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
              >
                {sparkles.map((sparkle, index) => (
                  <motion.i
                    key={index}
                    className="absolute h-2.5 w-2.5 rotate-45 rounded-sm"
                    style={{ backgroundColor: sparkle.color }}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.1, 0.85, 0.4],
                      x: sparkle.x,
                      y: sparkle.y,
                      rotate: sparkle.rotate,
                    }}
                    transition={{ duration: 1.3, delay: sparkle.delay, ease: 'easeOut' }}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar celebración"
              className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-white/80 p-2 text-gray-400 shadow-sm transition hover:scale-110 hover:text-gray-700"
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
            <p className="relative font-candy-beans text-sm tracking-wide text-[#a27a00]">
              ¡IDEA DESBLOQUEADA!
            </p>
            <HintGlbFallback />
            <h2
              id="smart-hint-celebration-title"
              className="relative mt-7 font-super-pandora text-2xl text-[#392f0e]"
            >
              La pista es tuya
            </h2>
            <p className="relative mt-2 font-simply-olive text-sm leading-6 text-gray-600">
              Usaste una Pista Inteligente. Mirá la lección para descubrir una nueva forma de
              avanzar.
            </p>
            <p className="relative mt-3 font-simply-olive text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
              Próximamente: animación 3D GLB
            </p>
            <button
              type="button"
              onClick={onClose}
              className="relative mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-b-4 border-[#bd9100] bg-[#f5bd00] px-5 py-3 font-super-pandora text-sm text-white transition hover:-translate-y-0.5 hover:bg-[#ffc800] active:translate-y-1 active:border-b-0"
            >
              <Check className="h-4 w-4" strokeWidth={3} /> Ver pista{' '}
              <Sparkles className="h-4 w-4" />
            </button>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
