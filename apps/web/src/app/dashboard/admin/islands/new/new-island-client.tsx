'use client';

import { useRouter } from '@bprogress/next';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useCreateAdminIsland } from '@/hooks/queries/useAdminIslands';

const IslandForm = dynamic(
  () => import('@/components/admin/islands/IslandForm').then((module) => module.IslandForm),
  {
    ssr: false,
    loading: () => <p className="py-10 text-sm text-gray-400">Cargando formulario…</p>,
  },
);

export default function NewIslandClient() {
  const router = useRouter();
  const createIsland = useCreateAdminIsland();
  const [error, setError] = useState('');

  return (
    <>
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <IslandForm
        submitLabel="Crear isla"
        onSubmit={async (data) => {
          setError('');
          try {
            const island = await createIsland.mutateAsync(data);
            router.push(`/dashboard/admin/islands/${island.id}`);
          } catch (createError) {
            setError(
              createError instanceof Error ? createError.message : 'No se pudo crear la isla',
            );
          }
        }}
      />
    </>
  );
}
