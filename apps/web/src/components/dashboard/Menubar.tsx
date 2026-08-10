'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Menu } from 'lucide-react';
import SidebarIcon from '@/components/ui/SidebarIcon';
import type { IconName } from '@/components/ui/SidebarIcon';

interface MenubarProps {
  userRole?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  href: string;
}

export default function Menubar({ userRole }: MenubarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  const navItems: NavItem[] = [
    { id: 'ruta', label: 'Ruta de aprendizaje', icon: 'map', href: '/dashboard' },
    { id: 'ejercicios', label: 'Ejercicios', icon: 'code', href: '#' },
    { id: 'retos', label: 'Retos', icon: 'trophy', href: '#' },
    { id: 'tienda', label: 'Tienda de canjes', icon: 'store', href: '/dashboard/store' },
    { id: 'laboratorio', label: 'Laboratorio', icon: 'flask', href: '/dashboard/lab' },
    { id: 'ranking', label: 'Ranking', icon: 'chart', href: '#' },
    { id: 'eventos', label: 'Eventos', icon: 'calendar', href: '#' },
    { id: 'certificados', label: 'Certificados', icon: 'badge', href: '#' },
    { id: 'ajustes', label: 'Ajustes', icon: 'gear', href: '/dashboard/settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const isAdminActive = pathname.startsWith('/dashboard/admin');

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed left-3 top-[4.5rem] z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <nav
        className={`${
          collapsed ? '-translate-x-full' : 'translate-x-0'
        } fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-gray-200 bg-gray-50/95 p-3 backdrop-blur-sm transition-transform duration-300 md:top-20 md:h-[calc(100vh-5rem)] lg:static lg:translate-x-0`}
      >
        <div className="mb-2 flex items-center justify-between px-2 pb-2">
          <span className="font-simply-olive text-xs font-bold uppercase tracking-widest text-gray-400">
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
            const active = isActive(item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => setCollapsed(true)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:bg-white/70 hover:text-gray-800'
                  }`}
                >
                  <SidebarIcon name={item.icon} active={active} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-pradera-400 shadow-xs" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {userRole === 'ADMIN' && (
          <div className="border-t border-gray-200 pt-2">
            <p className="mb-1 px-3 font-simply-olive text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Administración
            </p>
            <Link
              href="/dashboard/admin/courses"
              onClick={() => setCollapsed(true)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isAdminActive
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:bg-white/70 hover:text-gray-800'
              }`}
            >
              <SidebarIcon name="shield" active={isAdminActive} />
              <span>Cursos</span>
              {isAdminActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-bosque-400 shadow-xs" />
              )}
            </Link>
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
