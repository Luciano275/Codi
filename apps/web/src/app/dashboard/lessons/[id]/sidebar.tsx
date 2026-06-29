'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  FileCode2,
  Play,
  ChevronLeft,
  BookOpen,
} from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  THEORY: FileText,
  PRACTICE: FileCode2,
  CHALLENGE: Play,
  EXAM: FileCode2,
};

interface LessonItem {
  id: string;
  title: string;
  order: number;
  type: string;
}

interface LessonSidebarProps {
  courseTitle: string;
  courseSlug: string;
  moduleTitle: string;
  lessons: LessonItem[];
  currentLessonId: string;
}

export default function LessonSidebar({
  courseTitle,
  moduleTitle,
  lessons,
  currentLessonId,
}: LessonSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed left-3 top-24 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md lg:hidden"
      >
        <BookOpen className="h-4 w-4 text-gray-500" />
      </button>

      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`${
          collapsed ? '-translate-x-full' : 'translate-x-0'
        } fixed left-0 top-20 z-40 flex h-[calc(100vh-5rem)] w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:h-full lg:translate-x-0`}
      >
        {/* Header */}
        <div className="border-b border-gray-100 p-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-lagos-600"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Volver al dashboard
          </button>
          <h3 className="font-super-pandora text-sm text-gray-800">
            {courseTitle}
          </h3>
          <p className="font-simply-olive text-xs text-gray-400">
            {moduleTitle}
          </p>
        </div>

        {/* Lesson list */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">
            Contenido del módulo
          </p>
          <ul className="space-y-0.5">
            {lessons.map((lesson) => {
              const Icon = typeIcons[lesson.type] || FileText;
              const isCurrent = lesson.id === currentLessonId;

              return (
                <li key={lesson.id}>
                  <button
                    onClick={() => {
                      router.push(`/dashboard/lessons/${lesson.id}`);
                      setCollapsed(true);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                      isCurrent
                        ? 'bg-lagos-50 text-lagos-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isCurrent
                          ? 'bg-lagos-100 text-lagos-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 truncate">
                      <p
                        className={`truncate text-xs ${isCurrent ? 'font-semibold' : 'font-medium'}`}
                      >
                        {lesson.title}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {lesson.order}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-gray-100 p-3">
          <button
            onClick={() => setCollapsed(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
            Cerrar
          </button>
        </div>
      </aside>
    </>
  );
}
