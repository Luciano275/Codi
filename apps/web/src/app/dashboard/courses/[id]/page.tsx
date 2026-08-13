import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, FileText, FileCode2, Play, Zap, CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { serverFetch } from '@/lib/server-api';
import MarkdownRenderer from '@/components/dashboard/MarkdownRenderer';

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  level: number;
  region: string;
  xpReward: number;
  order: number;
  modules: {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      order: number;
      type: string;
      xpReward: number;
      content: Record<string, unknown>;
      problems: { id: string }[];
    }[];
  }[];
}

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

async function CourseContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await auth();
  if (!user) return null;

  let course: CourseDetail;
  try {
    course = await serverFetch<CourseDetail>(`/api/courses/${id}`);
  } catch {
    notFound();
  }

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/dashboard" className="transition-colors hover:text-lagos-600">
            Ruta de aprendizaje
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-600">{course.title}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-super-pandora text-3xl text-gray-900">
              {course.title}
            </h1>
            <p className="font-simply-olive mt-1 text-sm text-gray-500">
              {totalLessons} lecciones &middot; Nivel {course.level}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="font-candy-beans text-lg text-amber-700">
              +{course.xpReward} XP
            </span>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-6">
        {course.modules.map((mod) => (
          <div
            key={mod.id}
            className="rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="border-b border-gray-50 px-5 py-4">
              <h2 className="font-super-pandora text-base text-gray-800">
                Módulo {mod.order}: {mod.title}
              </h2>
            </div>

            <ul className="divide-y divide-gray-50">
              {mod.lessons.map((lesson) => {
                const Icon = typeIcons[lesson.type] || FileText;
                const hasProblems = lesson.problems.length > 0;

                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/dashboard/lessons/${lesson.id}`}
                      className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 group-hover:bg-lagos-100 group-hover:text-lagos-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800 group-hover:text-lagos-700">
                          {lesson.title}
                        </p>
                        <p className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{typeLabels[lesson.type] || lesson.type}</span>
                          {hasProblems && (
                            <>
                              <span>&middot;</span>
                              <span>{lesson.problems.length} ejercicios</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className="font-candy-beans text-xs text-amber-600">
                        +{lesson.xpReward} XP
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-lagos-500" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <CourseContent params={params} />;
}
