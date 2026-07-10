'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Zap, Gem, Trophy, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import type { UserProfile } from '@/lib/auth';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

interface TopbarProps {
  user: UserProfile;
}

export default function Topbar({ user }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [clientUser, setClientUser] = useState(user);

  const displayXp = useAnimatedValue(clientUser.xp);
  const displayGems = useAnimatedValue(clientUser.gems);

  useEffect(() => {
    fetch('/api/proxy/api/auth/me')
      .then((r) => r.json())
      .then((data) => { if (data?.user) setClientUser(data.user); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleUserUpdate() {
      fetch('/api/proxy/api/auth/me')
        .then((r) => r.json())
        .then((data) => { if (data?.user) setClientUser(data.user); })
        .catch(() => {});
    }
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

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
    <header className="flex h-20 items-center justify-between border-b border-gray-200/60 bg-white/80 px-6 shadow-xs backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Image src="/school_logo.png" alt="EET 3117" width={52} height={52} priority className="h-13 w-auto object-contain" />
        <div className="hidden md:block">
          <h1 className="font-super-pandora text-sm leading-tight text-gray-900">Escuela de Educación<br />Técnica Nº 3117</h1>
          <p className="font-simply-olive text-[11px] text-gray-500">Maestro Daniel Óscar Reyes</p>
        </div>
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 md:flex">
        <Image src="/logo.png" alt="Codi" width={60} height={60} priority className="w-full max-w-15 h-auto object-contain" />
        <div>
          <h2 className="font-super-pandora text-lg leading-tight text-gray-900">Programación Competitiva</h2>
          <p className="font-simply-olive text-xs text-gray-500">con Python</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="font-candy-beans text-sm text-amber-700">{displayXp.toLocaleString()} XP</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-cyan-50 px-3 py-1.5">
          <Gem className="h-4 w-4 text-cyan-500" />
          <span className="font-candy-beans text-sm text-cyan-700">{displayGems}</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-bosque-50 px-3 py-1.5">
          <Trophy className="h-4 w-4 text-bosque-500" />
          <span className="font-candy-beans text-sm text-bosque-700">Nivel {clientUser.level}</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-lagos-400 to-valle-400 text-sm font-bold text-white">
              {clientUser.displayName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-semibold text-gray-800 lg:block">{clientUser.displayName}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{clientUser.displayName}</p>
                <p className="text-xs text-gray-500">@{clientUser.username}</p>
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
