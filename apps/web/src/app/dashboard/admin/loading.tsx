import { AdminListSkeleton } from '@/components/admin/skeleton';

export default function AdminLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-1 h-4 w-64 animate-pulse rounded-md bg-gray-100" />
      </div>
      <AdminListSkeleton />
    </div>
  );
}
