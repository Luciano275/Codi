'use client';

import { useEffect } from 'react';
import { AlertTriangle, Loader2, X } from '@/components/ui/Icon';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  isPending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onCancel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isPending, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14253b]/70 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-desierto-200 bg-white shadow-2xl"
      >
        <div className="flex justify-between bg-desierto-50 px-6 pb-3 pt-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-desierto-100 text-desierto-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            aria-label="Cancelar"
            className="h-9 w-9 rounded-xl text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:opacity-40"
          >
            <X className="mx-auto h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-4">
          <h2 id="confirm-dialog-title" className="font-super-pandora text-2xl text-gray-900">
            {title}
          </h2>
          <p id="confirm-dialog-description" className="mt-3 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-b-4 border-red-700 bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-600 active:translate-y-0.5 active:border-b-2 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
