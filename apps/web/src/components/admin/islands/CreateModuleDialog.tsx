'use client';

import { useEffect, useState } from 'react';
import { Layers3, Loader2, X } from 'lucide-react';
import type { CourseMutationData } from '@/hooks/queries/useAdminCourses';

interface CreateModuleDialogProps {
  isOpen: boolean;
  isSaving: boolean;
  initialOrder: number;
  onClose: () => void;
  onSubmit: (data: CourseMutationData) => Promise<void>;
}

const inputClassName =
  'w-full rounded-2xl border-2 border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-pradera-400 focus:ring-4 focus:ring-pradera-100';

export function CreateModuleDialog({
  isOpen,
  isSaving,
  initialOrder,
  onClose,
  onSubmit,
}: CreateModuleDialogProps) {
  const [form, setForm] = useState<CourseMutationData>(() => createInitialForm(initialOrder));
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(createInitialForm(initialOrder));
      setIsClosing(false);
    }
  }, [initialOrder, isOpen]);

  if (!isOpen) return null;

  function closeDialog() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(onClose, 160);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onSubmit(form);
      closeDialog();
    } catch {}
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bosque-950/40 px-4 py-7 backdrop-blur-sm ${isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-module-title"
    >
      <form
        onSubmit={(event) => void submitForm(event)}
        className={`w-full max-w-2xl overflow-hidden rounded-[2rem] border-2 border-pradera-200 bg-[#fffdf7] shadow-[0_18px_0_rgba(27,116,32,0.9),0_30px_60px_rgba(13,46,24,0.3)] ${isClosing ? 'modal-content-exit' : 'modal-content-enter'}`}
      >
        <div className="relative overflow-hidden bg-pradera-500 px-6 pb-7 pt-6 text-white sm:px-8">
          <div className="absolute -right-8 -top-9 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute bottom-[-4rem] right-20 h-28 w-28 rounded-full bg-pradera-400/70" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-white/35 bg-white/15 shadow-[0_4px_0_rgba(0,0,0,0.12)]">
                <Layers3 className="h-7 w-7" strokeWidth={2.75} />
              </span>
              <div>
                <h2 id="create-module-title" className="mt-1 font-super-pandora text-2xl">
                  Crear módulo
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-7 sm:px-8">
          <p className="rounded-2xl border border-pradera-100 bg-pradera-50 px-4 py-3 text-sm leading-5 text-pradera-800">
            Elegí los datos del módulo. Su enlace único se genera automáticamente al guardarlo.
          </p>
          <label className="block">
            <span className="mb-2 block font-super-pandora text-base text-gray-800">Nombre</span>
            <input
              required
              autoFocus
              maxLength={255}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Ej. Fundamentos de programación"
              className={inputClassName}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              label="Nivel"
              value={form.level}
              min={1}
              onChange={(level) => setForm({ ...form, level })}
            />
            <label className="block">
              <span className="mb-2 block font-super-pandora text-base text-gray-800">Región</span>
              <input
                required
                maxLength={100}
                value={form.region}
                onChange={(event) => setForm({ ...form, region: event.target.value })}
                className={inputClassName}
              />
            </label>
            <NumberField
              label="Recompensa XP"
              value={form.xpReward}
              min={0}
              onChange={(xpReward) => setForm({ ...form, xpReward })}
            />
            <NumberField
              label="Orden"
              value={form.order}
              min={1}
              onChange={(order) => setForm({ ...form, order })}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t-2 border-pradera-100 bg-pradera-50/70 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={closeDialog}
            className="cursor-pointer rounded-2xl px-5 py-3 text-sm font-bold text-gray-500 transition hover:bg-white hover:text-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || !form.title.trim() || !form.region.trim()}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-b-4 border-pradera-700 bg-pradera-500 px-6 py-3 text-sm font-bold text-white transition hover:translate-y-0.5 hover:border-b-2 hover:bg-pradera-600 disabled:cursor-not-allowed disabled:border-pradera-300 disabled:bg-pradera-300"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Layers3 className="h-5 w-5" />
            )}
            {isSaving ? 'Creando…' : 'Crear módulo'}
          </button>
        </div>
      </form>
    </div>
  );
}

function createInitialForm(order: number): CourseMutationData {
  return { title: '', level: 1, region: 'intro', xpReward: 100, order };
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-super-pandora text-base text-gray-800">{label}</span>
      <input
        required
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClassName}
      />
    </label>
  );
}
