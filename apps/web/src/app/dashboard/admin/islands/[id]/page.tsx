'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { IslandForm } from '@/components/admin/islands/IslandForm';
import { useAdminIsland, useUpdateAdminIsland } from '@/hooks/queries/useAdminIslands';

export default function EditIslandPage() {
  const { id } = useParams<{ id: string }>();
  const islandQuery = useAdminIsland(id);
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

  if (islandQuery.isLoading)
    return <p className="py-10 text-center text-sm text-gray-400">Cargando isla…</p>;
  if (!islandQuery.data)
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        No se pudo cargar la isla.
      </p>
    );
  const island = islandQuery.data;

  return (
    <div className="mx-auto max-w-3xl">
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
      <Link
        href="/dashboard/admin/islands"
        className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-lagos-600"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a Islas
      </Link>
      <h1 className="font-super-pandora text-2xl text-gray-900">Editar {island.title}</h1>
      <p className="mb-6 mt-1 text-sm text-gray-400">
        Actualizá la publicación y el modelo del mundo.
      </p>
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <IslandForm
        island={island}
        submitLabel="Guardar cambios"
        onSubmit={async (data) => {
          setError('');
          setSaved(false);
          try {
            await updateIsland.mutateAsync({ id, data });
            showSavedToast();
          } catch (updateError) {
            setError(
              updateError instanceof Error ? updateError.message : 'No se pudo actualizar la isla',
            );
          }
        }}
      />
    </div>
  );
}
