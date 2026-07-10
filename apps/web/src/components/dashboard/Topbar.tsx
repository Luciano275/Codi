'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';
import type { UserProfile } from '@/lib/auth';
import { useCurrentUser, useInvalidateCurrentUser } from '@/hooks/queries/useCurrentUser';
import StatChip from '@/components/ui/StatChip';

interface TopbarProps {
  user: UserProfile;
}

export default function Topbar({ user }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: fetchedUser } = useCurrentUser();
  const invalidateCurrentUser = useInvalidateCurrentUser();

  const clientUser = fetchedUser ?? user;

  useEffect(() => {
    function handleUserUpdate() {
      invalidateCurrentUser();
    }
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, [invalidateCurrentUser]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative z-50 flex h-20 items-center justify-between border-b border-gray-200/60 bg-white/90 px-4 shadow-xs backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <Image src="/school_logo.png" alt="EET 3117" width={52} height={52} priority className="h-13 w-auto object-contain" />
        <div className="hidden md:block">
          <h1 className="font-super-pandora text-sm leading-tight text-gray-900">Escuela de Educación<br />Técnica Nº 3117</h1>
          <p className="font-simply-olive text-[11px] text-gray-500">Maestro Daniel Óscar Reyes</p>
        </div>
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 md:flex">
        <div className="relative">
          <Image src="/logo.png" alt="Codi" width={60} height={60} priority className="w-full max-w-15 h-auto object-contain drop-shadow-xs" />
        </div>
        <div>
          <h2 className="font-super-pandora text-lg leading-tight text-gray-900 drop-shadow-xs">
            Programación Competitiva
          </h2>
          <p className="font-simply-olive text-xs text-gray-500">con Python</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <StatChip
          icon={<span className="text-xs">⚡</span>}
          value={clientUser.xp}
          suffix=" XP"
          gradient="amber"
          label="Experiencia"
        />

        <StatChip
          icon={<span className="text-xs">💎</span>}
          value={clientUser.gems}
          gradient="cyan"
          label="Gemas"
        />

        <StatChip
          icon={<span className="text-xs">🏆</span>}
          value={clientUser.level}
          suffix=""
          gradient="purple"
          label="Nivel"
        />

        <div className="relative z-50" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-gray-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-lagos-400 to-valle-400 p-0.5 shadow-xs">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                <span className="text-sm font-bold text-lagos-600">
                  {clientUser.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <span className="hidden text-sm font-semibold text-gray-800 lg:block">{clientUser.displayName}</span>
            <ChevronDown className={`hidden h-4 w-4 text-gray-400 transition-transform duration-200 lg:block ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg animate-scale-in" style={{ zIndex: 99999 }}>
              <div className="border-b border-gray-100 bg-linear-to-r from-gray-50 to-white px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{clientUser.displayName}</p>
                <p className="font-simply-olive text-xs text-gray-500">@{clientUser.username}</p>
              </div>
              <div className="p-1">
                <Link href="/dashboard/profile" onClick={() => setDropdownOpen(false)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                  <User className="h-4 w-4 text-gray-400" />Mi perfil
                </Link>
                <Link href="/dashboard/settings" onClick={() => setDropdownOpen(false)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                  <Settings className="h-4 w-4 text-gray-400" />Ajustes
                </Link>
              </div>
              <div className="border-t border-gray-100 p-1">
                <button
                  onClick={async () => {
                    localStorage.removeItem('codi_token');
                    try { sessionStorage.removeItem('codi_user_cache'); } catch {}
                    await fetch('/api/auth/session', { method: 'DELETE' });
                    window.location.href = '/';
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
