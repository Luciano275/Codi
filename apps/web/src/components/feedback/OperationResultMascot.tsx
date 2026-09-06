'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { ErrorMascot } from './ErrorMascot';
import { SuccessMascot } from './SuccessMascot';

export type OperationResultStatus = 'success' | 'error';

interface OperationResultMascotProps {
  status: OperationResultStatus | null;
  resultKey?: string | number;
  title?: string;
  description?: string;
  score?: number;
  onDismiss: () => void;
  autoCloseMs?: number;
}

const DEFAULT_COPY: Record<OperationResultStatus, { title: string; description: string }> = {
  success: { title: '¡VAMOOOS!', description: '¡Excelente trabajo!' },
  error: { title: '¡Oh no!', description: '¡Intentémoslo de nuevo!' },
};

export function OperationResultMascot({
  status,
  resultKey,
  title,
  description,
  score,
  onDismiss,
  autoCloseMs = 4600,
}: OperationResultMascotProps) {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!status) return;

    const timeout = window.setTimeout(() => onDismissRef.current(), autoCloseMs);
    return () => window.clearTimeout(timeout);
  }, [autoCloseMs, resultKey, status]);

  const copy = status ? DEFAULT_COPY[status] : null;
  const animationKey = resultKey ?? status ?? 'result';

  return (
    <AnimatePresence mode="wait">
      {status && copy ? (
        <motion.section
          key={`${animationKey}-${status}`}
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-[160] grid place-items-center overflow-hidden px-3 py-4 sm:px-6"
        >
          <div aria-hidden="true" className="absolute inset-0 bg-[#17324d]/80" />

          <motion.div
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.88, y: reducedMotion ? 0 : 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.96, y: 10 }}
            transition={{ type: reducedMotion ? 'tween' : 'spring', stiffness: 310, damping: 24 }}
            className={`relative isolate w-full max-w-2xl overflow-hidden rounded-[1.75rem] border-4 border-[#17324d] shadow-[10px_10px_0_rgba(23,50,77,0.55)] ${
              status === 'success' ? 'bg-[#dff7ec]' : 'bg-[#e8edf3]'
            }`}
          >
            <div
              aria-hidden="true"
              className={`absolute inset-x-0 top-0 h-3 border-b-4 border-[#17324d] ${status === 'success' ? 'bg-[#24c9b4]' : 'bg-[#8da0b5]'}`}
            />
            <p className="absolute left-5 top-7 z-30 font-simply-olive text-[9px] font-bold uppercase text-[#17324d]/65 sm:left-7 sm:text-[10px]">
              Resultado de la misión
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-4 top-5 z-40 rounded-full border-2 border-[#17324d] bg-white p-1.5 text-[#17324d] shadow-[2px_2px_0_#17324d] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17324d] sm:right-6"
              aria-label="Cerrar resultado"
            >
              <X className="h-4 w-4" />
            </button>

            {status === 'success' ? (
              <SuccessMascot
                title={title ?? copy.title}
                description={description ?? copy.description}
                score={score}
                reducedMotion={reducedMotion}
              />
            ) : (
              <ErrorMascot
                title={title ?? copy.title}
                description={description ?? copy.description}
                score={score}
                reducedMotion={reducedMotion}
              />
            )}
          </motion.div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
