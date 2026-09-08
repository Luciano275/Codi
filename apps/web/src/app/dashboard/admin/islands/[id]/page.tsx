'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { IslandForm } from '@/components/admin/islands/IslandForm';
import { useAdminIsland, useUpdateAdminIsland } from '@/hooks/queries/useAdminIslands';

export default function EditIslandPage() {
  const { id } = useParams<{ id: string }>();
  const islandQuery = useAdminIsland(id);
  const updateIsland = useUpdateAdminIsland();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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
      {saved && (
        <p className="mb-4 rounded-xl bg-pradera-50 px-4 py-3 text-sm text-pradera-700">
          Cambios guardados.
        </p>
      )}
      <IslandForm
        island={island}
        submitLabel="Guardar cambios"
        onSubmit={async (data) => {
          setError('');
          setSaved(false);
          try {
            await updateIsland.mutateAsync({ id, data });
            setSaved(true);
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
