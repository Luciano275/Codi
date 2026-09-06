import { Dumbbell, Code2, Trophy, BookOpen, FlaskConical } from 'lucide-react';
import BottomActionCard from '@/components/ui/BottomActionCard';
import type { ElementType } from 'react';

interface Action {
  label: string;
  desc: string;
  icon: ElementType;
  gradient: string;
}

const actions: Action[] = [
  {
    label: 'Practicar',
    desc: 'Ejercicios por tema',
    icon: Dumbbell,
    gradient: 'from-pradera-400 to-pradera-600',
  },
  {
    label: 'Resolver',
    desc: 'Problemas tipo OIA',
    icon: Code2,
    gradient: 'from-lagos-400 to-lagos-600',
  },
  {
    label: 'Concursos',
    desc: 'Competencias',
    icon: Trophy,
    gradient: 'from-castillo-400 to-castillo-600',
  },
  {
    label: 'Editoriales',
    desc: 'Teoría y guías',
    icon: BookOpen,
    gradient: 'from-bosque-400 to-bosque-600',
  },
  {
    label: 'Laboratorio',
    desc: 'Experimentá con Python',
    icon: FlaskConical,
    gradient: 'from-valle-400 to-valle-600',
  },
];

export default function QuickActions() {
  return (
    <>
      <section className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between gap-1 px-2 py-1.5">
          {actions.map(({ label, icon: Icon, gradient }) => {
            const isLab = label === 'Laboratorio';
            const content = (
              <div
                className={`flex flex-1 items-center justify-center rounded-xl bg-linear-to-br ${gradient} py-2.5 text-white shadow-xs active:scale-90 transition-transform duration-150`}
              >
                <Icon className="h-5 w-5" />
              </div>
            );
            if (isLab) {
              return (
                <a key={label} href="/dashboard/lab" className="flex-1">
                  {content}
                </a>
              );
            }
            return (
              <button key={label} className="flex-1">
                {content}
              </button>
            );
          })}
        </div>
      </section>

      <section className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm md:block">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-3 gap-2 md:gap-3 lg:grid-cols-5">
          {actions.map(({ label, desc, icon, gradient }) => (
            <BottomActionCard
              key={label}
              icon={icon}
              label={label}
              description={desc}
              gradient={gradient}
              href={label === 'Laboratorio' ? '/dashboard/lab' : undefined}
            />
          ))}
        </div>
      </section>
    </>
  );
}
