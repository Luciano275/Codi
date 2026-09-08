import { Suspense } from 'react';
import { AdminListSkeleton } from '@/components/admin/skeleton';
import { fetchAdminIslands } from '@/lib/server-api';
import IslandsClient from './islands-client';

async function IslandsContent() {
  const islands = await fetchAdminIslands();
  return <IslandsClient initialIslands={islands} />;
}

export default function AdminIslandsPage() {
  return (
    <div>
      <div className="mb-6">
        <p className="font-simply-olive text-xs font-bold uppercase tracking-wider text-pradera-600">
          Mapa de mundos
        </p>
        <h1 className="font-super-pandora text-2xl text-gray-900">Islas</h1>
        <p className="font-simply-olive mt-1 text-sm text-gray-400">
          Configurá mundos, disponibilidad y modelos 3D.
        </p>
      </div>
      <Suspense fallback={<AdminListSkeleton />}>
        <IslandsContent />
      </Suspense>
    </div>
  );
}
