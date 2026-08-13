import { notFound } from 'next/navigation';
import {
  FileText,
  FileCode2,
  Play,
  ChevronRight,
  ExternalLink,
  Zap,
  CheckCircle2,
  Gem,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { fetchLesson } from '@/lib/server-api';
import MarkdownRenderer from '@/components/dashboard/MarkdownRenderer';
import LessonSidebar from './sidebar';
import LessonCompleteButton from './complete-button';

const typeIcons: Record<string, React.ElementType> = {
  THEORY: FileText,
  PRACTICE: FileCode2,
  CHALLENGE: Play,
  EXAM: FileCode2,
};

const typeLabels: Record<string, string> = {
  THEORY: 'Teoría',
  PRACTICE: 'Práctica',
  CHALLENGE: 'Desafío',
  EXAM: 'Examen',
};

const difficultyColors: Record<string, string> = {
  EASY: 'bg-pradera-100 text-pradera-700',
  MEDIUM: 'bg-desierto-100 text-desierto-700',
  HARD: 'bg-volcan-100 text-volcan-700',
  EXPERT: 'bg-bosque-100 text-bosque-700',
};

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await auth();
  if (!user) return null;

  let lesson;
  try {
    lesson = await fetchLesson(id);
  } catch {
    notFound();
  }

  const Icon = typeIcons[lesson.type as keyof typeof typeIcons] || FileText;
  const allLessons = lesson.module.lessons;
  const currentIndex = allLessons.findIndex((l) => l.id === id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const description = lesson.content?.description as string | undefined;

  return (
    <div className="flex h-full -m-6">
      {/* Sidebar */}
      <LessonSidebar
        courseTitle={lesson.module.course.title}
        courseSlug={lesson.module.course.slug}
        moduleTitle={lesson.module.title}
        lessons={allLessons}
        currentLessonId={id}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-10 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
            <a href={`/dashboard/courses/${lesson.module.course.id}`} className="transition-colors hover:text-lagos-600">
              {lesson.module.course.title}
            </a>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-500">{lesson.module.title}</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lagos-100 text-lagos-600">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-super-pandora text-2xl text-gray-900">
                  {lesson.title}
                </h1>
                <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {typeLabels[lesson.type] || lesson.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-candy-beans text-amber-600">
                      +{lesson.xpReward} XP
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {lesson.resources?.video && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-black shadow-sm">
              <video
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full"
                src={lesson.resources.video.url}
              >
                Tu navegador no puede reproducir este video.
              </video>
            </div>
          )}

          {/* Markdown content */}
          {description ? (
            <div className="mb-10 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <MarkdownRenderer content={description} />
            </div>
          ) : (
            <div className="mb-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-simply-olive text-sm text-gray-400">
                Esta lección no tiene contenido aún.
              </p>
            </div>
          )}

          {/* PDF resource */}
          {lesson.resources?.pdf && (
            <div className="mb-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-super-pandora mb-3 text-base text-gray-800">
                Material complementario
              </h3>
              <a
                href={lesson.resources.pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-lagos-50"
              >
                <FileText className="h-6 w-6 text-lagos-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 group-hover:text-lagos-700">
                    {lesson.title} — Material de estudio
                  </p>
                  <p className="text-xs text-gray-400">Abrir PDF</p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-lagos-500" />
              </a>
            </div>
          )}

          {/* Exercises */}
          {lesson.problems.length > 0 && (
            <div className="mb-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-super-pandora mb-3 text-base text-gray-800">
                Ejercicios ({lesson.problems.length})
              </h3>
              <div className="space-y-2">
                {lesson.problems.map((problem) => {
                  const solved = lesson.solvedProblemIds?.includes(problem.id);
                  return (
                  <a
                    key={problem.id}
                    href={`/dashboard/lab?problemId=${problem.id}&lessonId=${id}`}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors group ${
                      solved
                        ? 'border-pradera-200 bg-pradera-50 hover:bg-pradera-100'
                        : 'border-gray-100 hover:border-lagos-200 hover:bg-lagos-50'
                    }`}
                  >
                    {solved ? (
                      <CheckCircle2 className="h-5 w-5 text-pradera-500" />
                    ) : (
                      <FileCode2 className="h-5 w-5 text-gray-400 group-hover:text-lagos-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-lagos-700">
                        {problem.title}
                      </p>
                      <p className="text-xs text-gray-400">#{problem.cmsTaskId}</p>
                    </div>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${difficultyColors[problem.difficulty] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {problem.difficulty === 'EASY'
                        ? 'Fácil'
                        : problem.difficulty === 'MEDIUM'
                          ? 'Medio'
                          : problem.difficulty === 'HARD'
                            ? 'Difícil'
                            : 'Experto'}
                    </span>
                    <span className="font-candy-beans text-xs text-amber-600">
                      +{problem.xpReward} XP
                    </span>
                    <span className="flex items-center text-xs text-cyan-500 gap-2">
                      <Gem className="h-4 w-4 text-cyan-500" />
                      +{problem.gemsReward}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-lagos-500" />
                  </a>
                );
              })}
              </div>
            </div>
          )}

          {/* Complete button */}
          <div className="mb-10">
            <LessonCompleteButton lessonId={id} />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <div>
              {prevLesson && (
                <a
                  href={`/dashboard/lessons/${prevLesson.id}`}
                  className="group flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-lagos-600"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  <span className="max-w-xs truncate">{prevLesson.title}</span>
                </a>
              )}
            </div>
            <div className="text-right">
              {nextLesson && (
                <a
                  href={`/dashboard/lessons/${nextLesson.id}`}
                  className="group flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-lagos-600"
                >
                  <span className="max-w-xs truncate">{nextLesson.title}</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <LessonContent params={params} />;
}
