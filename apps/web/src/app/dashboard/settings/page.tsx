import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Bell,
  KeyRound,
  ChevronRight,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

interface SettingsItem {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  color: string;
  disabled?: boolean;
}

export default async function SettingsPage() {
  const user = await auth();
  if (!user) redirect('/');

  const sections: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'Cuenta',
      items: [
        {
          icon: User,
          label: 'Nombre de usuario',
          value: `@${user.username}`,
          color: 'text-lagos-600 bg-lagos-100',
        },
        {
          icon: Mail,
          label: 'Correo electrónico',
          value: user.email || 'Sin correo',
          color: 'text-pradera-600 bg-pradera-100',
        },
        {
          icon: Shield,
          label: 'Rol',
          value: user.role === 'ADMIN' ? 'Administrador' : 'Estudiante',
          color: 'text-bosque-600 bg-bosque-100',
        },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        {
          icon: Bell,
          label: 'Notificaciones',
          value: 'Próximamente',
          color: 'text-desierto-600 bg-desierto-100',
          disabled: true,
        },
        {
          icon: KeyRound,
          label: 'Cambiar contraseña',
          value: 'Próximamente',
          color: 'text-volcan-600 bg-volcan-100',
          disabled: true,
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-super-pandora text-2xl text-gray-900">Ajustes</h1>
        <p className="font-simply-olive mt-0.5 text-sm text-gray-500">
          Configuración de tu cuenta
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-50 px-5 py-3">
              <h2 className="font-super-pandora text-sm text-gray-700">{section.title}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-4 px-5 py-3.5 ${item.disabled ? 'opacity-60' : ''}`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-simply-olive text-sm font-medium text-gray-900">
                        {item.label}
                      </p>
                      <p className="truncate text-xs text-gray-400">{item.value}</p>
                    </div>
                    {item.disabled ? (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                        PRONTO
                      </span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
