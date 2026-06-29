'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Map,
  Code2,
  Trophy,
  BarChart3,
  Calendar,
  Award,
  Settings,
  Shield,
  ChevronLeft,
  Menu,
} from 'lucide-react';

interface MenubarProps {
  userRole?: string;
}

export default function Menubar({ userRole }: MenubarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  const navItems = [
    { id: 'ruta', label: 'Ruta de aprendizaje', icon: Map, href: '/dashboard' },
    { id: 'ejercicios', label: 'Ejercicios', icon: Code2, href: '#' },
    { id: 'retos', label: 'Retos', icon: Trophy, href: '#' },
    { id: 'ranking', label: 'Ranking', icon: BarChart3, href: '#' },
    { id: 'eventos', label: 'Eventos', icon: Calendar, href: '#' },
    { id: 'certificados', label: 'Certificados', icon: Award, href: '#' },
    { id: 'ajustes', label: 'Ajustes', icon: Settings, href: '#' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed left-3 top-24 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Overlay on mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <nav
        className={`${
          collapsed ? '-translate-x-full' : 'translate-x-0'
        } fixed left-0 top-20 z-40 flex h-[calc(100vh-5rem)] w-60 flex-col border-r border-gray-200 bg-gray-50/90 p-3 backdrop-blur-sm transition-transform duration-300 lg:static lg:translate-x-0`}
      >
        <div className="mb-2 flex items-center justify-between px-2 pb-2">
          <span className="font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">
            Menú
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <ul className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    router.push(item.href);
                    setCollapsed(true);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white text-pradera-600 shadow-xs'
                      : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${active ? 'text-pradera-500' : 'text-gray-400'}`}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-pradera-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Admin section — only for admins */}
        {userRole === 'ADMIN' && (
          <div className="border-t border-gray-200 pt-2">
            <p className="mb-1 px-3 font-simply-olive text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Administración
            </p>
            <button
              onClick={() => {
                router.push('/dashboard/admin/lessons');
                setCollapsed(true);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                pathname.startsWith('/dashboard/admin')
                  ? 'bg-white text-bosque-600 shadow-xs'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
              }`}
            >
              <Shield
                className={`h-5 w-5 ${pathname.startsWith('/dashboard/admin') ? 'text-bosque-500' : 'text-gray-400'}`}
              />
              <span>Gestión de lecciones</span>
              {pathname.startsWith('/dashboard/admin') && (
                <div className="ml-auto h-2 w-2 rounded-full bg-bosque-400" />
              )}
            </button>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <p className="px-3 font-candy-beans text-xs text-gray-400">
            v0.1.0
          </p>
        </div>
      </nav>
    </>
  );
}
