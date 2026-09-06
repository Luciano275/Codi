'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { Gem, X } from 'lucide-react';
import type { StoreReward } from '@codi/types';

interface StoreDialogProps {
  reward: StoreReward | null;
  gems: number;
  trimester: number | null;
  submitting: boolean;
  onClose: () => void;
  onSelectTrimester: (trimester: number) => void;
  onConfirm: () => void;
}

export function StoreDialog({
  reward,
  gems,
  trimester,
  submitting,
  onClose,
  onSelectTrimester,
  onConfirm,
}: StoreDialogProps) {
  const reducedMotion = useReducedMotion();
  const isExam = reward?.type === 'EXAM_BONUS_POINT';
  const open = Boolean(reward);
  const availableTrimesters = [1, 2, 3].filter(
    (item) => !reward?.acquiredTrimesters?.includes(item),
  );
  const canConfirm = !isExam || trimester !== null;
  const fadeTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: 'easeOut' as const };
  const dialogTransition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 400, damping: 32, mass: 0.75 };

  function requestClose() {
    if (!submitting) onClose();
  }

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, submitting]);

  return (
    <AnimatePresence>
      {open && reward && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-gray-950/30 p-4"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? {} : { opacity: 0 }}
          transition={fadeTransition}
          onMouseDown={requestClose}
          role="presentation"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="redeem-dialog-title"
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? {} : { opacity: 0, y: 8, scale: 0.985 }}
            transition={dialogTransition}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl"
          >
            <div className="relative bg-linear-to-br from-lagos-50 via-white to-valle-50 px-6 pb-5 pt-6">
              <button
                onClick={requestClose}
                disabled={submitting}
                className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="font-simply-olive text-xs font-bold uppercase text-lagos-600">
                Confirmar canje
              </p>
              <h2
                id="redeem-dialog-title"
                className="mt-1 pr-8 font-super-pandora text-2xl text-gray-900"
              >
                ¿Querés canjear {reward.name}?
              </h2>
              <div className="mt-4 flex w-fit items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-white shadow-lg">
                <Gem className="h-5 w-5 fill-valle-300 text-valle-300" />
                <span className="font-candy-beans text-xl">{reward.cost}</span>
                <span className="font-simply-olive text-xs">gemas</span>
              </div>
            </div>
            <div className="px-6 py-5">
              {isExam && (
                <fieldset>
                  <legend className="font-super-pandora text-base text-gray-800">
                    Elegí el trimestre
                  </legend>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {availableTrimesters.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => onSelectTrimester(item)}
                        className={`rounded-xl border px-2 py-3 font-candy-beans text-lg transition ${trimester === item ? 'border-desierto-400 bg-desierto-50 text-desierto-700 ring-2 ring-desierto-200' : 'border-gray-200 text-gray-600 hover:border-desierto-200 hover:bg-desierto-50/50'}`}
                      >
                        {item}.º
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <p className="font-simply-olive text-sm leading-6 text-gray-600">
                Después del canje tendrás{' '}
                <span className="font-candy-beans text-lg text-lagos-700">
                  {Math.max(0, gems - reward.cost)}
                </span>{' '}
                gemas.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={submitting}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!canConfirm || submitting}
                  className="rounded-xl bg-linear-to-r from-lagos-500 to-valle-500 px-4 py-2.5 font-super-pandora text-sm text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {submitting ? 'Canjeando…' : 'Confirmar canje'}
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
