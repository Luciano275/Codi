import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await auth();

  if (!user) {
    redirect('/api/auth/logout');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
