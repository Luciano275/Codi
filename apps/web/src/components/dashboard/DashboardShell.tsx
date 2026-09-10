'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { UserProfile } from '@/lib/auth';
import Menubar from './Menubar';
import PageTransition from './PageTransition';
import QuickActions from './QuickActions';
import Topbar from './Topbar';

interface DashboardShellProps {
  user: UserProfile;
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isIslandSelection = pathname === '/dashboard';
  const isIslandPath = pathname.startsWith('/dashboard/islands/');
  const isIslandExperience = isIslandSelection || isIslandPath;

  return (
    <div className="h-dvh overflow-hidden bg-gray-50">
      <Topbar user={user} islandMode={isIslandSelection} onMenuOpen={() => setMenuOpen(true)} />
      <Menubar open={menuOpen} userRole={user.role} onClose={() => setMenuOpen(false)} />
      <main
        id="main-content"
        className={`relative h-dvh min-w-0 overflow-x-hidden overflow-y-auto ${isIslandSelection ? 'overflow-hidden' : ''} ${isIslandExperience ? '' : 'pt-16 md:pt-20'}`}
      >
        <PageTransition animateTransform={!isIslandPath}>
          {isIslandSelection ? (
            <div className="h-full">{children}</div>
          ) : isIslandPath ? (
            <div className="min-h-0 w-full">{children}</div>
          ) : (
            <div className="mx-auto min-h-0 w-full max-w-[1600px] p-3 md:p-5 lg:p-6">
              {children}
            </div>
          )}
        </PageTransition>
        {isIslandSelection ? <QuickActions /> : null}
      </main>
    </div>
  );
}
