import BottomActionCard from '@/components/ui/BottomActionCard';

const actions = [
  { label: 'Practicar', desc: 'Ejercicios por tema', emoji: '🏋️', gradient: 'from-pradera-400 to-pradera-600' },
  { label: 'Resolver', desc: 'Problemas tipo OIA', emoji: '💻', gradient: 'from-lagos-400 to-lagos-600' },
  { label: 'Concursos', desc: 'Competencias', emoji: '🏆', gradient: 'from-castillo-400 to-castillo-600' },
  { label: 'Editoriales', desc: 'Teoría y guías', emoji: '📚', gradient: 'from-bosque-400 to-bosque-600' },
  { label: 'Laboratorio', desc: 'Experimentá con Python', emoji: '🔬', gradient: 'from-valle-400 to-valle-600' },
];

export default function QuickActions() {
  return (
    <>
      <section className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between gap-1 px-2 py-1.5">
          {actions.map((action) => {
            const isLab = action.label === 'Laboratorio';
            const content = (
              <div className={`flex flex-1 items-center justify-center rounded-xl bg-linear-to-br ${action.gradient} py-2.5 text-white shadow-xs active:scale-90 transition-transform duration-150`}>
                <span className="text-base drop-shadow-xs">{action.emoji}</span>
              </div>
            );
            if (isLab) {
              return <a key={action.label} href="/dashboard/lab" className="flex-1">{content}</a>;
            }
            return <button key={action.label} className="flex-1">{content}</button>;
          })}
        </div>
      </section>

      <section className="hidden border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm md:block">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          {actions.map((action) => (
            <BottomActionCard
              key={action.label}
              emoji={action.emoji}
              label={action.label}
              description={action.desc}
              gradient={action.gradient}
              href={action.label === 'Laboratorio' ? '/dashboard/lab' : undefined}
            />
          ))}
        </div>
      </section>
    </>
  );
}
