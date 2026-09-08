import Link from 'next/link';
import { ArrowLeft, BookOpen, Check, Files, LockKeyhole, Play } from 'lucide-react';

const STEP_POSITIONS = [18, 36, 58, 74, 62, 42, 20, 33, 54, 72];
const STEP_GAP = 176;

export interface LearningPathStep {
  id: string;
  title: string;
  eyebrow: string;
  detail: string;
  href?: string;
  kind?: 'lesson' | 'submodule';
  completed: boolean;
  current: boolean;
  locked: boolean;
}

interface LearningPathProps {
  backHref: string;
  backLabel: string;
  description: string;
  eyebrow: string;
  itemLabel: string;
  steps: LearningPathStep[];
  title: string;
  variant?: 'lessons' | 'modules' | 'submodules';
}

function createPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const midpoint = (previous.y + point.y) / 2;
    return `${path} C ${previous.x} ${midpoint}, ${point.x} ${midpoint}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

export default function LearningPath({
  backHref,
  backLabel,
  description,
  eyebrow,
  itemLabel,
  steps,
  title,
  variant = 'modules',
}: LearningPathProps) {
  const pathHeight = Math.max(540, steps.length * STEP_GAP + 60);
  const pathPoints = steps.map((_, index) => ({
    x: STEP_POSITIONS[index % STEP_POSITIONS.length],
    y: index * STEP_GAP + 76,
  }));
  const path = createPath(pathPoints);

  return (
    <section className="relative left-1/2 min-h-dvh w-screen -translate-x-1/2 overflow-hidden bg-[#f1f2f6] pt-16 md:pt-20">
      {variant === 'submodules' ? (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(88,204,2,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(88,204,2,0.1)_1px,transparent_1px)] [background-size:2rem_2rem]" />
          <div className="pointer-events-none absolute left-[7%] top-28 rotate-[-12deg] rounded-2xl border-2 border-[#a9dc8b] bg-[#e5f6da] px-5 py-3 font-candy-beans text-2xl text-[#58cc02] shadow-[5px_5px_0_#cbe8ba]">
            {'</>'}
          </div>
          <div className="pointer-events-none absolute right-[9%] top-[23rem] rotate-[10deg] rounded-2xl border-2 border-[#b7d7f0] bg-[#e4f2fc] px-5 py-3 font-candy-beans text-2xl text-[#4298d2] shadow-[5px_5px_0_#cbe0ef]">
            {'{}'}
          </div>
          <span className="pointer-events-none absolute -left-10 top-[48%] h-52 w-52 rotate-12 rounded-[2.25rem] border-[14px] border-[#f3e3ba]/70" />
          <span className="pointer-events-none absolute -right-12 top-[70%] h-64 w-64 rotate-[-18deg] rounded-[2.75rem] border-[18px] border-[#d9e9d1]/80" />
          <span className="pointer-events-none absolute left-[15%] top-[83%] h-16 w-16 rounded-2xl bg-[#f0dbe7]/70 shadow-[96px_-26px_0_0_rgba(214,234,252,0.7),180px_18px_0_-8px_rgba(239,228,184,0.7)]" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-75">
            <span className="absolute -left-12 -top-10 h-64 w-64 rounded-full bg-[#dcebf3]" />
            <span className="absolute right-[7%] top-12 h-56 w-56 rounded-full bg-[#eee8da]" />
            <span className="absolute -left-16 top-[36%] h-60 w-60 rounded-full bg-[#e9e8ec]" />
            <span className="absolute -right-10 top-[47%] h-72 w-72 rounded-full bg-[#f3e5df]" />
            <span className="absolute left-[8%] top-[74%] h-72 w-72 rounded-full bg-[#e5eddc]" />
            <span className="absolute -right-16 top-[87%] h-80 w-80 rounded-full bg-[#e2ece0]" />
          </div>
          <div className="pointer-events-none absolute left-[7%] top-36 h-10 w-32 rounded-full bg-white/45 shadow-[28px_10px_0_0_rgba(255,255,255,0.45),60px_-3px_0_-7px_rgba(255,255,255,0.45)]" />
          <div className="pointer-events-none absolute right-[8%] top-[30rem] h-12 w-36 rounded-full bg-white/45 shadow-[34px_9px_0_0_rgba(255,255,255,0.45),68px_-2px_0_-9px_rgba(255,255,255,0.45)]" />
        </>
      )}

      <header className="relative z-10 px-5 pb-8 pt-5 text-center md:px-10 md:pb-10 md:pt-8">
        <Link
          href={backHref}
          className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-xl border border-green-900/10 bg-white/85 px-3 py-2 text-xs font-bold text-green-900 shadow-sm transition-transform hover:-translate-y-0.5 md:left-10 md:top-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <p className="font-simply-olive mt-12 text-xs font-bold uppercase text-green-700/55 md:mt-5">
          {eyebrow}
        </p>
        <h1 className="font-super-pandora mt-1 text-2xl text-[#244229] md:text-4xl">{title}</h1>
        <p className="font-simply-olive mx-auto mt-1 max-w-xl text-sm text-[#527057]">
          {description}
        </p>
        <div className="absolute right-10 top-8 hidden items-center gap-2 rounded-2xl border border-green-900/5 bg-white/85 px-4 py-3 text-sm text-green-900 shadow-sm md:flex">
          <Files className="h-5 w-5 text-pradera-500" />
          <span className="font-super-pandora">
            {steps.length} {itemLabel}
          </span>
        </div>
      </header>

      {steps.length > 0 ? (
        <div className="relative z-10 w-full" style={{ height: pathHeight }}>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 100 ${pathHeight}`}
            preserveAspectRatio="none"
          >
            <path d={path} fill="none" stroke="#b8bdc2" strokeLinecap="round" strokeWidth="4.5" />
            <path d={path} fill="none" stroke="#dfddd2" strokeLinecap="round" strokeWidth="3" />
          </svg>

          {steps.map((step, index) => {
            const point = pathPoints[index];
            const isSubmodule = step.kind === 'submodule';
            const stateClass = isSubmodule
              ? step.completed
                ? 'border-[#398bb1] bg-[#72c2e2] shadow-[#2f718e]'
                : step.current
                  ? 'border-[#5eadd0] bg-[#9bdaf0] shadow-[#5295b3]'
                  : 'border-[#b0c8d2] bg-[#d7e5ea] shadow-[#a4b9c2]'
              : step.completed
                ? 'border-[#46a302] bg-[#58cc02] shadow-[#2b7d03]'
                : step.current
                  ? 'border-[#7ac92e] bg-[#9be84a] shadow-[#6dae2a]'
                  : 'border-[#b8cbb1] bg-[#d8e4d4] shadow-[#aebaa9]';
            const capClass = isSubmodule
              ? step.completed
                ? 'bg-[#9bdcf0] text-[#1f5670]'
                : step.current
                  ? 'bg-[#c4edf8] text-[#28627c]'
                  : 'bg-[#eaf2f4] text-[#7f969e]'
              : step.completed
                ? 'bg-[#65d90b] text-white'
                : step.current
                  ? 'bg-[#a9ed66] text-[#28591b]'
                  : 'bg-[#e7eee4] text-[#80927a]';

            const className = `group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${step.locked ? 'cursor-not-allowed opacity-45 saturate-50' : ''}`;
            const content = (
              <>
                <span
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[5px] shadow-[0_9px_0] transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-105 md:h-24 md:w-24 ${stateClass} ${step.current ? 'animate-pulse' : ''}`}
                >
                  <span
                    className={`font-super-pandora flex h-[72%] w-[72%] items-center justify-center rounded-full text-xl shadow-inner md:text-2xl ${capClass}`}
                  >
                    {index + 1}
                  </span>
                  {step.completed ? (
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[#f1f2f6] bg-white text-[#58cc02]">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  ) : step.current ? (
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[#f1f2f6] bg-[#58cc02] text-white">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </span>
                  ) : (
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[#f1f2f6] bg-[#b8cbb1] text-[#6e8069]">
                      <LockKeyhole className="h-3.5 w-3.5" />
                    </span>
                  )}
                </span>
                <span className="mt-4 max-w-[11rem] rounded-xl border border-green-900/10 bg-white/90 px-3 py-2 text-center shadow-sm transition-transform group-hover:-translate-y-0.5">
                  <span className="font-simply-olive block text-[9px] font-bold uppercase text-green-700/55">
                    {step.eyebrow}
                  </span>
                  <span className="font-super-pandora mt-0.5 block text-xs text-[#29482e]">
                    {step.title}
                  </span>
                  <span className="mt-1 flex items-center justify-center gap-1 text-[11px] text-[#6f8973]">
                    <BookOpen className="h-3 w-3" />
                    {step.detail}
                  </span>
                </span>
              </>
            );

            return step.locked || !step.href ? (
              <div
                key={step.id}
                aria-disabled="true"
                className={className}
                style={{ left: `${point.x}%`, top: point.y }}
              >
                {content}
              </div>
            ) : (
              <Link
                key={step.id}
                href={step.href}
                aria-label={step.title}
                className={className}
                style={{ left: `${point.x}%`, top: point.y }}
              >
                {content}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="relative z-10 mx-auto mt-20 max-w-sm rounded-2xl bg-white/85 px-6 py-5 text-center text-sm text-green-900/60 shadow-sm">
          Esta ruta todavía no tiene contenido cargado.
        </div>
      )}
    </section>
  );
}
