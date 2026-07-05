import Link from 'next/link';
import {
  Dumbbell,
  Code2,
  Trophy,
  BookOpen,
  FlaskConical,
} from 'lucide-react';

const actions = [
  { label: 'Practicar', desc: 'Ejercicios por tema', icon: Dumbbell, color: 'from-pradera-400 to-pradera-500' },
  { label: 'Resolver', desc: 'Problemas tipo OIA', icon: Code2, color: 'from-lagos-400 to-lagos-500' },
  { label: 'Concursos', desc: 'Competencias', icon: Trophy, color: 'from-castillo-400 to-castillo-500' },
  { label: 'Editoriales', desc: 'Teoría y guías', icon: BookOpen, color: 'from-bosque-400 to-bosque-500' },
  { label: 'Laboratorio', desc: 'Experimentá con Python', icon: FlaskConical, color: 'from-valle-400 to-valle-500' },
];

export default function QuickActions() {
  return (
    <>
      {/* Mobile: bottom tab bar (Instagram-style, icons only) */}
      <section className="sticky bottom-0 border-t border-gray-200 bg-white md:hidden">
        <div className="flex items-center justify-between gap-1 px-3 py-1.5">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLab = action.label === 'Laboratorio';
            const ButtonContent = (
              <div className={`flex flex-1 items-center justify-center rounded-xl bg-linear-to-br ${action.color} py-2 text-white shadow-xs active:scale-95`}>
                <Icon className="h-5 w-5" />
              </div>
            );
            if (isLab) {
              return (
                <Link key={action.label} href="/dashboard/lab" className="flex-1">
                  {ButtonContent}
                </Link>
              );
            }
            return (
              <button key={action.label} className="flex-1">
                {ButtonContent}
              </button>
            );
          })}
        </div>
      </section>

      {/* Desktop: full buttons */}
      <section className="hidden border-t border-gray-200 bg-white px-6 py-4 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLab = action.label === 'Laboratorio';
            const ButtonContent = (
              <div className={`group flex flex-1 items-center gap-3 rounded-2xl bg-linear-to-br ${action.color} px-4 py-3 text-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-95`}>
                <Icon className="h-6 w-6 shrink-0" />
                <div className="text-left">
                  <p className="font-super-pandora text-sm leading-tight">
                    {action.label}
                  </p>
                  <p className="font-simply-olive text-[10px] text-white/80">
                    {action.desc}
                  </p>
                </div>
              </div>
            );
            if (isLab) {
              return (
                <Link key={action.label} href="/dashboard/lab" className="flex-1">
                  {ButtonContent}
                </Link>
              );
            }
            return (
              <button key={action.label} className="flex-1">
                {ButtonContent}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
