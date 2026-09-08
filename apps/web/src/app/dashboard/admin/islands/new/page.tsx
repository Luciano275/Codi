'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from '@bprogress/next';
import { useState } from 'react';
import { IslandForm } from '@/components/admin/islands/IslandForm';
import { useCreateAdminIsland } from '@/hooks/queries/useAdminIslands';

export default function NewIslandPage() {
  const router = useRouter();
  const createIsland = useCreateAdminIsland();
  const [error, setError] = useState('');

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/admin/islands"
        className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-lagos-600"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a Islas
      </Link>
      <h1 className="font-super-pandora text-2xl text-gray-900">Nueva isla</h1>
      <p className="mb-6 mt-1 text-sm text-gray-400">
        El slug se genera una sola vez a partir del nombre.
      </p>
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
    </div>
  );
}
