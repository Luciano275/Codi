import { redirect } from 'next/navigation';
import { Providers } from '@/app/providers';
import DashboardShell from '@/components/dashboard/DashboardShell';
import ProgressBarProvider from '@/components/progress-bar';
import { auth } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await auth();

  if (!user) {
    redirect('/api/auth/logout');
  }

  return (
    <Providers>
      <ProgressBarProvider>
        <DashboardShell user={user}>{children}</DashboardShell>
      </ProgressBarProvider>
    </Providers>
  );
}
