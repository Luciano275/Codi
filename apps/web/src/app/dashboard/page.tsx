'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, User, Shield, Zap, Gem, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00D2D3] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Image src="/logo.png" alt="Codi" width={100} height={100} className="h-8 w-auto" />
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70 transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#00A3FF] to-[#00D2D3] text-3xl font-bold text-white">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hola, {user.displayName}</h1>
            <p className="text-white/60">@{user.username}</p>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm text-white/60">
              <Zap className="h-4 w-4 text-yellow-400" />
              XP
            </div>
            <p className="text-2xl font-bold">{user.xp.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm text-white/60">
              <Gem className="h-4 w-4 text-cyan-400" />
              Gemas
            </div>
            <p className="text-2xl font-bold">{user.gems}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm text-white/60">
              <Trophy className="h-4 w-4 text-amber-400" />
              Nivel
            </div>
            <p className="text-2xl font-bold">{user.level}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5 text-[#00D2D3]" />
            Información de la cuenta
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/50">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/50">Rol</dt>
              <dd className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-[#00D2D3]" />
                {user.role === 'ADMIN' ? 'Administrador' : 'Estudiante'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/50">ID en CMS</dt>
              <dd className="font-mono text-xs">{user.cmsUserId}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
