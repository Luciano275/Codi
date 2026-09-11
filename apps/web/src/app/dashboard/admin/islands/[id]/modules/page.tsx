import Link from 'next/link';
import { ArrowLeft, Pencil } from '@/components/ui/Icon';
import { notFound } from 'next/navigation';
import { IslandModulesPanel } from '@/components/admin/islands/IslandModulesPanel';
import { fetchAdminIsland } from '@/lib/server-api';

export default async function IslandModulesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const island = await fetchAdminIsland(id).catch(() => notFound());
  return (
    <div className="w-full">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/dashboard/admin/islands"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-pradera-700"
        >
          <ArrowLeft className="h-4 w-4" /> Islas
        </Link>
        <Link
          href={`/dashboard/admin/islands/${island.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-pradera-700"
        >
          <Pencil className="h-4 w-4" /> Editar isla
        </Link>
      </div>
      <IslandModulesPanel island={island} />
    </div>
  );
}
