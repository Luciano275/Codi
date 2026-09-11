'use client';

import { CheckCircle2 } from '@/components/ui/Icon';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useUpdateAdminIsland } from '@/hooks/queries/useAdminIslands';
import type { AdminIsland } from '@/lib/server-api';

const IslandForm = dynamic(
  () => import('@/components/admin/islands/IslandForm').then((module) => module.IslandForm),
  {
    ssr: false,
    loading: () => <p className="py-10 text-sm text-gray-400">Cargando formulario…</p>,
  },
);

export default function IslandEditClient({ island }: { island: AdminIsland }) {
  const updateIsland = useUpdateAdminIsland();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const savedToastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(savedToastTimer.current);
    },
    [],
  );

  function showSavedToast() {
    setSaved(true);
    clearTimeout(savedToastTimer.current);
    savedToastTimer.current = setTimeout(() => setSaved(false), 4000);
  }

  return (
    <>
      {saved && (
        <div
          role="status"
          className="fixed right-5 top-24 z-50 flex items-center gap-3 rounded-2xl border-2 border-pradera-300 bg-pradera-50 px-5 py-4 text-pradera-800 shadow-[0_12px_32px_rgba(47,158,68,0.28)]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pradera-500 text-white">
            <CheckCircle2 className="h-5 w-5" strokeWidth={3} />
          </span>
          <span>
            <span className="font-super-pandora block text-base">¡Cambios guardados!</span>
            <span className="block text-xs font-medium text-pradera-700">
              La configuración de la isla ya está actualizada.
            </span>
          </span>
        </div>
      )}
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <IslandForm
        island={island}
        submitLabel="Guardar cambios"
        onSubmit={async (data) => {
          setError('');
          setSaved(false);
          try {
            await updateIsland.mutateAsync({ id: island.id, data });
            showSavedToast();
          } catch (updateError) {
            setError(
              updateError instanceof Error ? updateError.message : 'No se pudo actualizar la isla',
            );
          }
        }}
      />
    </>
  );
}
