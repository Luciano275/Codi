'use client';

import Link from 'next/link';
import { Box, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '@bprogress/next';
import {
  useAdminIslands,
  useDeleteAdminIsland,
  useUpdateAdminIsland,
} from '@/hooks/queries/useAdminIslands';
import type { AdminIsland } from '@/lib/server-api';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function IslandsClient({ initialIslands }: { initialIslands: AdminIsland[] }) {
  const router = useRouter();
  const islandsQuery = useAdminIslands();
  const updateIsland = useUpdateAdminIsland();
  const deleteIsland = useDeleteAdminIsland();
  const [error, setError] = useState('');
  const [islandToDelete, setIslandToDelete] = useState<AdminIsland | null>(null);
  const islands = islandsQuery.data ?? initialIslands;

  async function toggleAvailability(island: AdminIsland) {
    setError('');
    try {
      await updateIsland.mutateAsync({ id: island.id, data: { available: !island.available } });
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : 'No se pudo actualizar la isla',
      );
    }
  }

  async function removeIsland() {
    if (!islandToDelete) return;
    setError('');
    try {
      await deleteIsland.mutateAsync(islandToDelete.id);
      setIslandToDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la isla');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-simply-olive text-sm text-gray-400">{islands.length} islas</p>
        <Link
          href="/dashboard/admin/islands/new"
          className="flex items-center gap-2 rounded-xl bg-lagos-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lagos-600"
        >
          <Plus className="h-4 w-4" /> Nueva isla
        </Link>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.4fr_2fr_.5fr_.7fr_.7fr_.7fr_.7fr] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-bold uppercase text-gray-400 lg:grid">
          <span>Nombre</span>
          <span>Descripción</span>
          <span>Orden</span>
          <span>Cursos</span>
          <span>Disponible</span>
          <span>Modelo 3D</span>
          <span>Acciones</span>
        </div>
        {islands.map((island) => (
          <article
            key={island.id}
            role="link"
            tabIndex={0}
            onClick={() => router.push(`/dashboard/admin/islands/${island.id}/modules`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(`/dashboard/admin/islands/${island.id}/modules`);
              }
            }}
            className="grid cursor-pointer gap-3 border-b border-gray-100 px-5 py-4 outline-none transition-colors hover:bg-lagos-50 focus-visible:bg-lagos-50 last:border-0 lg:grid-cols-[1.4fr_2fr_.5fr_.7fr_.7fr_.7fr_.7fr] lg:items-center lg:gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="h-9 w-2 rounded-full" style={{ backgroundColor: island.accent }} />
              <div>
                <p className="font-medium text-gray-900">{island.title}</p>
                <p className="text-xs text-gray-400">{island.slug}</p>
              </div>
            </div>
            <p className="line-clamp-2 text-sm text-gray-500">{island.description}</p>
            <span className="text-sm text-gray-600">{island.order}</span>
            <span className="text-sm text-gray-600">{island._count.courses}</span>
            <button
              type="button"
              role="switch"
              aria-checked={island.available}
              aria-label={`Cambiar disponibilidad de ${island.title}`}
              onClick={(event) => {
                event.stopPropagation();
                void toggleAvailability(island);
              }}
              className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 p-0.5 transition-colors ${
                island.available
                  ? 'justify-end border-pradera-600 bg-pradera-500'
                  : 'justify-start border-gray-300 bg-gray-200'
              }`}
            >
              <span className="block h-4 w-4 rounded-full bg-white shadow-sm" />
            </button>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Box className="h-4 w-4" />
              {island.hasCustomModel ? 'GLB privado' : 'Heredado'}
            </span>
            <div className="flex items-center gap-1">
              <Link
                href={`/dashboard/admin/islands/${island.id}`}
                onClick={(event) => event.stopPropagation()}
                aria-label={`Editar ${island.title}`}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIslandToDelete(island);
                }}
                disabled={island._count.courses > 0}
                title={
                  island._count.courses > 0
                    ? 'Esta isla tiene cursos asociados y no puede eliminarse.'
                    : 'Eliminar isla'
                }
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
        {islands.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-gray-400">No hay islas todavía.</p>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(islandToDelete)}
        title="¿Eliminar esta isla?"
        description={`Eliminarás ${islandToDelete?.title ?? 'esta isla'} de forma permanente. Esta acción no se puede deshacer.`}
        isPending={deleteIsland.isPending}
        onCancel={() => setIslandToDelete(null)}
        onConfirm={() => void removeIsland()}
      />
    </div>
  );
}
