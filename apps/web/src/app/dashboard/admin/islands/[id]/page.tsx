import Link from 'next/link';
import { ArrowLeft } from '@/components/ui/Icon';
import { notFound } from 'next/navigation';
import { fetchAdminIsland } from '@/lib/server-api';
import IslandEditClient from './island-edit-client';

export default async function EditIslandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const island = await fetchAdminIsland(id).catch(() => notFound());

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
      <IslandEditClient island={island} />
    </div>
  );
}
