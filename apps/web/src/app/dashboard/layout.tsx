import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/dashboard/Topbar';
import Menubar from '@/components/dashboard/Menubar';
import QuickActions from '@/components/dashboard/QuickActions';
import PageTransition from '@/components/dashboard/PageTransition';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await auth();

  if (!user) {
    redirect('/api/auth/logout');
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <Topbar user={user} />
      <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
        <Menubar userRole={user.role} />
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <PageTransition>
            <div className="mx-auto min-h-0 w-full max-w-[1600px] p-3 md:p-5 lg:p-6">
              {children}
            </div>
          </PageTransition>
          <QuickActions />
        </main>
      </div>
    </div>
  );
}
