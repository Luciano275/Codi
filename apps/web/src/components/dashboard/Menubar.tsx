'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import SidebarIcon from '@/components/ui/SidebarIcon';
import type { IconName } from '@/components/ui/SidebarIcon';

interface MenubarProps {
  open: boolean;
  userRole?: string;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  href: string;
}

export default function Menubar({ open, userRole, onClose }: MenubarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { id: 'ruta', label: 'Mapa de Mundos', icon: 'map', href: '/dashboard' },
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
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/islands/');
    }
    return pathname.startsWith(href);
  };

  const isAdminActive = pathname.startsWith('/dashboard/admin');
  const isTeachingActive = pathname.startsWith('/dashboard/teaching');

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-60 bg-[#07111f]/55 backdrop-blur-[2px]" onClick={onClose} />
      )}

      <nav
        aria-hidden={!open}
        inert={!open}
        className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-70 flex w-[min(20rem,88vw)] flex-col border-r border-white/10 bg-[#f8fbf3] p-4 shadow-[18px_0_55px_rgba(4,19,34,0.28)] transition-transform duration-300 ease-out`}
      >
        <div className="mb-5 flex items-center justify-between border-b border-gray-200 px-2 pb-4 pt-1">
          <div>
            <span className="font-super-pandora text-xl text-gray-900">Menú de viaje</span>
            <p className="font-simply-olive text-xs text-gray-400">
              Explorá Codi sin perder tu progreso
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar menú principal"
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-xs'
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

        {(userRole === 'TEACHER' || userRole === 'ADMIN') && (
          <div className="border-t border-gray-200 pt-2">
            <p className="mb-1 px-3 font-simply-olive text-[10px] font-bold uppercase text-gray-400">
              Docencia
            </p>
            <Link
              href="/dashboard/teaching/lessons"
              onClick={onClose}
              className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isTeachingActive
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-xs'
              }`}
            >
              <SidebarIcon name="badge" active={isTeachingActive} />
              <span>Lecciones</span>
              {isTeachingActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-pradera-400 shadow-xs" />
              )}
            </Link>
          </div>
        )}

        {userRole === 'ADMIN' && (
          <div className="border-t border-gray-200 pt-2">
            <p className="mb-1 px-3 font-simply-olive text-[10px] font-bold uppercase text-gray-400">
              Administración
            </p>
            <Link
              href="/dashboard/admin/courses"
              onClick={onClose}
              className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isAdminActive
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-xs'
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
          <p className="px-3 font-candy-beans text-xs text-gray-400">v0.1.0</p>
        </div>
      </nav>
    </>
  );
}
