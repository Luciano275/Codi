'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type {
  AdminReward,
  RewardCategory,
  RewardEditorInput,
  RewardType,
  RewardVisual,
} from '@codi/types';

const categories: Array<{ value: RewardCategory; label: string }> = [
  { value: 'EXAMS', label: 'Exámenes' },
  { value: 'PRACTICE', label: 'Práctica' },
  { value: 'ADVANTAGES', label: 'Ventajas' },
  { value: 'SPECIALS', label: 'Especiales' },
];

const rewardTypes: Array<{ value: RewardType; label: string }> = [
  { value: 'EXAM_BONUS_POINT', label: 'Punto extra en examen' },
  { value: 'SMART_HINT', label: 'Pista inteligente' },
  { value: 'DOUBLE_XP', label: 'Doble XP temporal' },
];

const visuals: Array<{ value: RewardVisual; label: string }> = [
  { value: 'exam', label: 'Examen dorado' },
  { value: 'hint', label: 'Pista violeta' },
  { value: 'double-xp', label: 'XP turquesa' },
];

const emptyReward: RewardEditorInput = {
  slug: '',
  name: '',
  description: '',
  category: 'SPECIALS',
  cost: 10,
  type: 'SMART_HINT',
  isActive: true,
  visual: 'hint',
};

function toEditorInput(reward: AdminReward | null): RewardEditorInput {
  if (!reward) return emptyReward;
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    redemptionCount: _redemptionCount,
    ...input
  } = reward;
  return input;
}

interface RewardEditorDialogProps {
  reward: AdminReward | null;
  submitting: boolean;
  onClose: () => void;
  onSave: (input: RewardEditorInput) => void;
}

export function RewardEditorDialog({
  reward,
  submitting,
  onClose,
  onSave,
}: RewardEditorDialogProps) {
  const [type, setType] = useState<RewardType>(() => toEditorInput(reward).type);
  const initial = toEditorInput(reward);
  const reducedMotion = useReducedMotion();
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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') requestClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitting]);

  function submit(formData: FormData) {
    onSave({
      slug: String(formData.get('slug') ?? '').trim(),
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      category: formData.get('category') as RewardCategory,
      cost: Number(formData.get('cost')),
      type: formData.get('type') as RewardType,
      isActive: formData.get('isActive') === 'on',
      visual: formData.get('visual') as RewardVisual,
      durationHours: type === 'DOUBLE_XP' ? Number(formData.get('durationHours')) : undefined,
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[120] overflow-y-auto bg-gray-950/40 p-4 sm:p-8"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? {} : { opacity: 0 }}
      transition={fadeTransition}
      onMouseDown={requestClose}
    >
      <motion.section
        aria-labelledby="reward-editor-title"
        aria-modal="true"
        className="mx-auto w-full max-w-2xl rounded-[1.8rem] bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion ? {} : { opacity: 0, y: 8, scale: 0.985 }}
        transition={dialogTransition}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-candy-beans text-sm text-lagos-600">Panel docente</p>
            <h2 id="reward-editor-title" className="font-super-pandora text-2xl text-gray-900">
              {reward ? 'Editar recompensa' : 'Nueva recompensa'}
            </h2>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            onClick={requestClose}
            disabled={submitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" name="name" defaultValue={initial.name} required />
          <Field
            label="Slug"
            name="slug"
            defaultValue={initial.slug}
            placeholder="mi-recompensa"
            required
          />
          <Field
            label="Costo en gemas"
            name="cost"
            defaultValue={initial.cost}
            min="1"
            required
            type="number"
          />
          <SelectField
            label="Categoría"
            name="category"
            defaultValue={initial.category}
            options={categories}
          />
          <SelectField
            label="Tipo de beneficio"
            name="type"
            defaultValue={initial.type}
            options={rewardTypes}
            onChange={(event) => setType(event.target.value as RewardType)}
          />
          <SelectField
            label="Estilo de card"
            name="visual"
            defaultValue={initial.visual}
            options={visuals}
          />
          {type === 'DOUBLE_XP' && (
            <Field
              label="Duración (horas)"
              name="durationHours"
              defaultValue={initial.durationHours ?? 24}
              min="1"
              max="168"
              required
              type="number"
            />
          )}
          <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 font-simply-olive text-sm font-bold text-gray-700 sm:self-end">
            <input
              defaultChecked={initial.isActive}
              name="isActive"
              type="checkbox"
              className="h-4 w-4 accent-lagos-600"
            />
            Disponible en la tienda
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block font-simply-olive text-xs font-bold uppercase tracking-wide text-gray-500">
              Descripción
            </span>
            <textarea
              defaultValue={initial.description}
              name="description"
              required
              maxLength={300}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-simply-olive text-sm outline-none transition focus:border-lagos-500 focus:ring-2 focus:ring-lagos-100"
            />
          </label>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={submitting}
              className="rounded-xl px-4 py-2.5 font-super-pandora text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              disabled={submitting}
              className="rounded-xl bg-lagos-600 px-4 py-2.5 font-super-pandora text-sm text-white shadow-sm transition hover:bg-lagos-700 disabled:opacity-60"
            >
              {submitting ? 'Guardando…' : reward ? 'Guardar cambios' : 'Crear recompensa'}
            </button>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
}

function Field({ label, ...props }: React.ComponentProps<'input'> & { label: string }) {
  return (
    <label>
      <span className="mb-1.5 block font-simply-olive text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-simply-olive text-sm outline-none transition focus:border-lagos-500 focus:ring-2 focus:ring-lagos-100"
      />
    </label>
  );
}

function SelectField({
  label,
  options,
  ...props
}: React.ComponentProps<'select'> & {
  label: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label>
      <span className="mb-1.5 block font-simply-olive text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <select
        {...props}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-simply-olive text-sm outline-none transition focus:border-lagos-500 focus:ring-2 focus:ring-lagos-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
