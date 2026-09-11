'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from '@/components/ui/Icon';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    localStorage.removeItem('codi_token');
    try {
      sessionStorage.removeItem('codi_user_cache');
    } catch {
      /* noop */
    }
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70 transition-colors hover:border-red-500/50 hover:text-red-400"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </button>
  );
}
