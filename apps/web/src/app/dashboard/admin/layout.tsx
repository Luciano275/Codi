import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await auth();

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div>
      <nav className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-3">
        <Link
          href="/dashboard/admin/courses"
          className="font-simply-olive text-sm text-gray-500 transition-colors hover:text-lagos-600"
        >
          Cursos
        </Link>
        <span className="text-gray-300">/</span>
      </nav>
      {children}
    </div>
  );
}
