'use client';

import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useParams } from 'next/navigation';
import { IslandModulesPanel } from '@/components/admin/islands/IslandModulesPanel';
import { useAdminIsland } from '@/hooks/queries/useAdminIslands';

export default function IslandModulesPage() {
  const { id } = useParams<{ id: string }>();
  const islandQuery = useAdminIsland(id);
  if (islandQuery.isLoading)
    return <p className="py-10 text-center text-sm text-gray-400">Cargando módulos…</p>;
  if (!islandQuery.data)
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        No se pudo cargar la isla.
      </p>
    );
  const island = islandQuery.data;
  return (
    <div className="w-full">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/dashboard/admin/islands"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-lagos-600"
        >
          <ArrowLeft className="h-4 w-4" /> Islas
        </Link>
        <Link
          href={`/dashboard/admin/islands/${island.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-lagos-600"
        >
          <Pencil className="h-4 w-4" /> Editar isla
        </Link>
      </div>
      <IslandModulesPanel island={island} />
    </div>
  );
}
