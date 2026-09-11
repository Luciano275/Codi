import Link from 'next/link';
import { ArrowLeft } from '@/components/ui/Icon';
import NewIslandClient from './new-island-client';

export default function NewIslandPage() {
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
      <NewIslandClient />
    </div>
  );
}
