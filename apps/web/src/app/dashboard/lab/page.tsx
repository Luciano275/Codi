import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LabClient from './lab-client';

export const metadata = {
  title: 'Laboratorio | Codi',
  description: 'Experimenta con Python en el laboratorio de Codi',
};

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-valle-200 border-t-valle-500" />
        <p className="font-simply-olive text-sm text-gray-400">Cargando laboratorio...</p>
      </div>
    </div>
  );
}

export default async function LabPage() {
  const user = await auth();
  if (!user) redirect('/');
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LabClient user={user} />
    </Suspense>
  );
}
