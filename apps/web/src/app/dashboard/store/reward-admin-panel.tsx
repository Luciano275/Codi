'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Gem, Pencil, Plus, Trash2 } from '@/components/ui/Icon';
import type { AdminReward, RewardEditorInput } from '@codi/types';
import { createReward, deleteReward, updateReward } from './actions';
import { RewardEditorDialog } from './reward-editor-dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface RewardAdminPanelProps {
  initialCatalog: AdminReward[];
}

export function RewardAdminPanel({ initialCatalog }: RewardAdminPanelProps) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [editingReward, setEditingReward] = useState<AdminReward | null | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const [rewardToDelete, setRewardToDelete] = useState<AdminReward | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveReward(input: RewardEditorInput) {
    startTransition(async () => {
      try {
        const saved = editingReward
          ? await updateReward({ id: editingReward.id, ...input })
          : await createReward(input);
        setCatalog((current) =>
          editingReward
            ? current.map((reward) => (reward.id === saved.id ? saved : reward))
            : [...current, saved],
        );
        setEditingReward(undefined);
        setNotice('Catálogo actualizado.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudo guardar la recompensa.');
      }
    });
  }

  function toggleReward(reward: AdminReward) {
    startTransition(async () => {
      try {
        const saved = await updateReward({ ...reward, isActive: !reward.isActive });
        setCatalog((current) => current.map((item) => (item.id === saved.id ? saved : item)));
        setNotice(saved.isActive ? 'Recompensa activada.' : 'Recompensa desactivada.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudo actualizar la recompensa.');
      }
    });
  }

  function removeReward() {
    if (!rewardToDelete) return;
    startTransition(async () => {
      try {
        await deleteReward(rewardToDelete.id);
        setCatalog((current) => current.filter((item) => item.id !== rewardToDelete.id));
        setRewardToDelete(null);
        setNotice('Recompensa eliminada.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudo eliminar la recompensa.');
      }
    });
  }

  return (
    <section className="rounded-[1.7rem] border border-lagos-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-super-pandora text-xl text-gray-900">Administrar recompensas</h2>
          <p className="font-simply-olive text-sm text-gray-500">
            Creá, editá, activá o retirá recompensas del catálogo.
          </p>
        </div>
        <button
          onClick={() => setEditingReward(null)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-pradera-500 px-4 py-2.5 font-super-pandora text-sm text-white shadow-sm transition hover:bg-pradera-600"
        >
          <Plus className="h-4 w-4" />
          Nueva recompensa
        </button>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-lagos-50 px-3 py-2 font-simply-olive text-sm text-lagos-800"
        >
          {notice}
        </p>
      )}
      <ul className="mt-4 grid gap-2 xl:grid-cols-2">
        {catalog.map((reward) => (
          <li
            key={reward.id}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lagos-600 shadow-xs">
              <Gem className="h-4 w-4 fill-valle-300 text-valle-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-super-pandora text-sm text-gray-900">{reward.name}</p>
              <p className="font-simply-olive text-xs text-gray-500">
                {reward.cost} gemas · {reward.redemptionCount} canjes ·{' '}
                {reward.isActive ? 'Activa' : 'Inactiva'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={isPending}
                title={reward.isActive ? 'Desactivar' : 'Activar'}
                onClick={() => toggleReward(reward)}
                className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-white hover:text-lagos-700 disabled:opacity-50"
              >
                {reward.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                disabled={isPending}
                title="Editar"
                onClick={() => setEditingReward(reward)}
                className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-white hover:text-lagos-700 disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                disabled={isPending || reward.redemptionCount > 0}
                title={
                  reward.redemptionCount ? 'No se puede eliminar: ya tiene canjes' : 'Eliminar'
                }
                onClick={() => setRewardToDelete(reward)}
                className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {editingReward !== undefined && (
          <RewardEditorDialog
            reward={editingReward}
            submitting={isPending}
            onClose={() => !isPending && setEditingReward(undefined)}
            onSave={saveReward}
          />
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={Boolean(rewardToDelete)}
        title="¿Eliminar esta recompensa?"
        description={`Eliminarás ${rewardToDelete?.name ?? 'esta recompensa'} del catálogo. Esta acción no se puede deshacer.`}
        isPending={isPending}
        onCancel={() => setRewardToDelete(null)}
        onConfirm={removeReward}
      />
    </section>
  );
}
