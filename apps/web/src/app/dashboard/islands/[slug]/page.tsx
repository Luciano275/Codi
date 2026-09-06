import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Check, LockKeyhole, Play, Sparkles } from 'lucide-react';
import { fetchIslands, fetchProgress } from '@/lib/server-api';

const PATH_POSITIONS = ['2%', '18%', '38%', '54%', '42%', '22%', '5%', '20%', '40%', '55%'];

export default async function IslandLearningPathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [islands, progress] = await Promise.all([fetchIslands(), fetchProgress()]);
  const island = islands.find((candidate) => candidate.slug === slug);
  if (!island || !island.available) notFound();

  const courseProgress = new Map(progress.courses.map((course) => [course.courseId, course]));
  const modules = island.courses.flatMap((course) =>
    course.modules.map((module) => ({
      ...module,
      course,
      completed: courseProgress.get(course.id)?.completed ?? false,
    })),
  );

  return (
    <div className="relative min-h-[calc(100dvh-8rem)] overflow-hidden rounded-[2rem] bg-[#eef7e7] shadow-[inset_0_0_0_1px_rgba(42,83,45,0.08)]">
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_18%,#cdefff_0_8%,transparent_8.5%),radial-gradient(circle_at_82%_35%,#ffe8bd_0_9%,transparent_9.5%),radial-gradient(circle_at_28%_72%,#e4d9ff_0_10%,transparent_10.5%),radial-gradient(circle_at_76%_88%,#c9efcf_0_11%,transparent_11.5%)]" />
      <div className="relative z-10 flex items-start justify-between gap-4 p-4 md:p-7">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-2 rounded-xl border border-green-900/10 bg-white/80 px-3 py-2 text-xs font-bold text-green-900 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a las islas
          </Link>
          <p className="font-simply-olive text-xs font-bold uppercase tracking-[0.25em] text-green-700/55">
            Ruta de aprendizaje
          </p>
          <h1 className="font-super-pandora mt-1 text-2xl text-[#244229] md:text-4xl">
            {island.title}
          </h1>
          <p className="font-simply-olive mt-1 max-w-xl text-sm text-[#527057]">
            {island.description}
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm text-green-900 shadow-sm md:flex">
          <Sparkles className="h-5 w-5 text-pradera-500" />
          <span className="font-super-pandora">{modules.length} módulos</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-8 px-3 pb-16 pt-8 md:gap-10 md:px-8">
        {modules.map((module, index) => {
          const firstLesson = module.lessons[0];
          const isCurrent =
            !module.completed && modules.slice(0, index).every((item) => item.completed);
          const href = firstLesson
            ? `/dashboard/lessons/${firstLesson.id}`
            : `/dashboard/courses/${module.course.id}`;
          const left = PATH_POSITIONS[index % PATH_POSITIONS.length];

          return (
            <div key={module.id} className="relative flex" style={{ paddingLeft: left }}>
              {index < modules.length - 1 ? (
                <div
                  className="absolute top-16 h-16 w-1 rounded-full bg-green-800/15"
                  style={{ left: `calc(${left} + 1.9rem)` }}
                />
              ) : null}
              <Link
                href={href}
                className="group relative flex max-w-[min(34rem,calc(100vw-4rem))] items-center gap-3"
              >
                <span
                  className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[5px] text-xl shadow-[0_7px_0_rgba(43,125,3,0.25)] transition-transform group-hover:-translate-y-1 group-hover:scale-105 ${module.completed ? 'border-[#46a302] bg-[#58cc02] text-white' : isCurrent ? 'animate-pulse border-[#58cc02] bg-[#9be84a] text-[#234511]' : 'border-[#aecaa2] bg-[#d8ead2] text-[#688064]'}`}
                >
                  {module.completed ? (
                    <Check className="h-7 w-7" />
                  ) : isCurrent ? (
                    <Play className="h-6 w-6 fill-current" />
                  ) : (
                    <LockKeyhole className="h-5 w-5" />
                  )}
                </span>
                <span className="min-w-0 rounded-2xl border border-green-900/10 bg-white/88 px-4 py-3 shadow-md transition-shadow group-hover:shadow-lg">
                  <span className="font-simply-olive block text-[10px] font-bold uppercase tracking-widest text-green-700/55">
                    {module.course.title} · Módulo {module.order}
                  </span>
                  <span className="font-super-pandora mt-0.5 block text-sm text-[#29482e] md:text-base">
                    {module.title}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-[#6f8973]">
                    <BookOpen className="h-3.5 w-3.5" />
                    {module.lessons.length} lecciones
                  </span>
                </span>
              </Link>
            </div>
          );
        })}

        {modules.length === 0 ? (
          <div className="mx-auto rounded-2xl bg-white/85 px-6 py-5 text-center text-sm text-green-900/60 shadow-sm">
            Esta isla todavía no tiene módulos cargados.
          </div>
        ) : null}
      </div>
    </div>
  );
}
