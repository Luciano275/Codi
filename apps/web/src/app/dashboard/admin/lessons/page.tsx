'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  BookOpen,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import MarkdownRenderer from '@/components/dashboard/MarkdownRenderer';
import { LessonAssetPreview } from '@/components/uploads/LessonAssetPreview';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { adminFetch } from '@/lib/admin-api';
import { queryKeys } from '@/lib/query-keys';
import { LessonForm } from '@/components/admin/LessonForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useAdminLessons,
  useAdminCourses,
  useAdminProblems,
  useDeleteLesson,
} from '@/hooks/queries/useAdminLessons';
import type {
  AdminLesson,
  AdminProblem,
  LessonType,
  Difficulty,
} from '@/hooks/queries/useAdminLessons';

const LESSON_TYPES: { value: LessonType; label: string }[] = [
  { value: 'THEORY', label: 'Teoría' },
  { value: 'PRACTICE', label: 'Práctica' },
  { value: 'CHALLENGE', label: 'Desafío' },
  { value: 'EXAM', label: 'Examen' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-pradera-100 text-pradera-700',
  MEDIUM: 'bg-desierto-100 text-desierto-700',
  HARD: 'bg-volcan-100 text-volcan-700',
  EXPERT: 'bg-bosque-100 text-bosque-700',
};

interface LessonManagementContext {
  islandId?: string;
  islandTitle?: string;
  courseId?: string;
  moduleId?: string;
}

interface LessonToast {
  tone: 'success' | 'error';
  title: string;
  detail: string;
}

export default function AdminLessonsPage({ context }: { context?: LessonManagementContext }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const islandId = context?.islandId ?? searchParams.get('islandId') ?? '';
  const filterModuleId = context?.moduleId ?? searchParams.get('moduleId') ?? '';
  const filterCourseId = context?.courseId ?? searchParams.get('courseId') ?? '';

  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [initialFormCourseId, setInitialFormCourseId] = useState('');
  const [initialFormModuleId, setInitialFormModuleId] = useState('');
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<LessonToast | null>(null);
  const [isClosingLessonForm, setIsClosingLessonForm] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const formCloseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const lessonsQuery = useAdminLessons();
  const coursesQuery = useAdminCourses();
  const problemsQuery = useAdminProblems();
  const deleteLessonMutation = useDeleteLesson();

  const lessons = lessonsQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const allProblems = problemsQuery.data ?? [];

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(formCloseTimer.current);
    },
    [],
  );

  function showToast(nextToast: LessonToast) {
    setToast(nextToast);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

  function closeLessonForm() {
    if (isClosingLessonForm) return;
    setIsClosingLessonForm(true);
    clearTimeout(formCloseTimer.current);
    formCloseTimer.current = setTimeout(() => {
      setShowForm(false);
      setEditingLesson(null);
      setIsClosingLessonForm(false);
    }, 160);
  }

  const handleCreate = async (data: any) => {
    try {
      await adminFetch('/api/admin/lessons', { method: 'POST', body: JSON.stringify(data) });
      await lessonsQuery.refetch();
      closeLessonForm();
      showToast({
        tone: 'success',
        title: '¡Lección creada!',
        detail: 'La nueva lección ya está lista para tus estudiantes.',
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'No se pudo crear la lección',
        detail: error instanceof Error ? error.message : 'Revisá los datos e intentá nuevamente.',
      });
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingLesson) return;
    try {
      await adminFetch(`/api/admin/lessons/${editingLesson.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await lessonsQuery.refetch();
      closeLessonForm();
      showToast({
        tone: 'success',
        title: '¡Cambios guardados!',
        detail: 'La lección y su Pista Inteligente fueron actualizadas.',
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'No se pudieron guardar los cambios',
        detail: error instanceof Error ? error.message : 'Revisá los datos e intentá nuevamente.',
      });
    }
  };

  const handleDelete = async () => {
    if (!lessonToDelete) return;
    await deleteLessonMutation.mutateAsync(lessonToDelete);
    setLessonToDelete(null);
  };

  const updateProblem = async (problemId: string, updates: Partial<AdminProblem>) => {
    try {
      await adminFetch(`/api/admin/problems/${problemId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['problems', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.lessons.admin.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
      ]);
    } catch {}
  };

  const typeLabel = (t: LessonType) => LESSON_TYPES.find((x) => x.value === t)?.label ?? t;

  if (lessonsQuery.isPending && problemsQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-lagos-500" />
      </div>
    );
  }

  const displayedLessons = filterModuleId
    ? lessons.filter((l) => l.module.id === filterModuleId)
    : lessons;

  const filterCourse = courses.find((c) => c.id === filterCourseId);
  const filterModule = filterCourse?.modules?.find((m) => m.id === filterModuleId);

  return (
    <div className="mx-auto max-w-5xl">
      {toast && (
        <div
          role={toast.tone === 'success' ? 'status' : 'alert'}
          className={`fixed right-5 top-24 z-[60] flex max-w-sm items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-[0_12px_32px_rgba(20,36,27,0.22)] ${toast.tone === 'success' ? 'border-pradera-300 bg-pradera-50 text-pradera-800' : 'border-red-200 bg-red-50 text-red-800'}`}
        >
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${toast.tone === 'success' ? 'bg-pradera-500' : 'bg-red-500'}`}
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 className="h-5 w-5" strokeWidth={3} />
            ) : (
              <AlertCircle className="h-5 w-5" strokeWidth={3} />
            )}
          </span>
          <span className="min-w-0">
            <span className="block font-super-pandora text-sm">{toast.title}</span>
            <span className="mt-0.5 block font-simply-olive text-xs leading-5 opacity-85">
              {toast.detail}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="cursor-pointer rounded-full p-1 text-current/55 transition hover:bg-white/50 hover:text-current"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {filterCourse && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
          {islandId && (
            <>
              <Link
                href={`/dashboard/admin/islands/${islandId}/modules`}
                className="transition-colors hover:text-lagos-600"
              >
                {context?.islandTitle ?? 'Isla'}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <Link
            href={
              islandId
                ? `/dashboard/admin/islands/${islandId}/courses/${filterCourse.id}`
                : `/dashboard/admin/lessons?courseId=${filterCourse.id}`
            }
            className="transition-colors hover:text-lagos-600"
          >
            {filterCourse.title}
          </Link>
          {filterModule && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-600">{filterModule.title}</span>
            </>
          )}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-super-pandora text-2xl text-gray-900">Gestión de Lecciones</h1>
          <p className="font-simply-olive mt-0.5 text-sm text-gray-500">
            Creá y administrá las lecciones de la plataforma
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLesson(null);
            setInitialFormCourseId(filterCourseId);
            setInitialFormModuleId(filterModuleId);
            setIsClosingLessonForm(false);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-pradera-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pradera-600"
        >
          <Plus className="h-4 w-4" />
          Nueva lección
        </button>
      </div>

      {lessonsQuery.isError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {lessonsQuery.error.message}
        </div>
      )}

      {showForm && (
        <div
          className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bosque-950/45 px-4 py-7 backdrop-blur-sm sm:py-10 ${isClosingLessonForm ? 'modal-overlay-exit' : 'modal-overlay-enter'}`}
        >
          <div
            className={`w-full max-w-3xl overflow-hidden rounded-[2rem] border-2 border-lagos-200 bg-[#fffdf7] shadow-[0_18px_0_rgba(4,110,145,0.85),0_30px_60px_rgba(13,46,24,0.32)] ${isClosingLessonForm ? 'modal-content-exit' : 'modal-content-enter'}`}
          >
            <div className="relative overflow-hidden bg-lagos-500 px-6 py-6 text-white sm:px-8">
              <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute bottom-[-4rem] right-24 h-28 w-28 rounded-full bg-lagos-400/70" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-white/35 bg-white/15 shadow-[0_4px_0_rgba(0,0,0,0.12)]">
                    <BookOpen className="h-7 w-7" strokeWidth={2.75} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white/75">
                      {editingLesson
                        ? 'Afiná el recorrido de aprendizaje'
                        : 'Sumá un nuevo desafío'}
                    </p>
                    <h2 className="mt-1 font-super-pandora text-2xl sm:text-3xl">
                      {editingLesson ? 'Editar lección' : 'Nueva lección'}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeLessonForm();
                  }}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="Cerrar modal de lección"
                >
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>
            </div>
            <div className="px-6 py-7 sm:px-8">
              <div className="mb-6 rounded-2xl border border-lagos-100 bg-lagos-50 px-4 py-3 text-sm leading-5 text-lagos-800">
                Completá los detalles y prepará una experiencia que invite a seguir avanzando.
              </div>
              <LessonForm
                lesson={editingLesson}
                courses={courses}
                allProblems={allProblems}
                onSave={editingLesson ? handleUpdate : handleCreate}
                onCancel={() => {
                  closeLessonForm();
                }}
                initialCourseId={initialFormCourseId}
                initialModuleId={initialFormModuleId}
                onUpdateProblem={updateProblem}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {displayedLessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-simply-olive text-gray-500">
              {filterModuleId
                ? 'Este módulo no tiene lecciones.'
                : 'No hay lecciones aún. Creá la primera.'}
            </p>
          </div>
        ) : (
          displayedLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedId(expandedId === lesson.id ? null : lesson.id);
                  }
                }}
                className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    lesson.type === 'THEORY'
                      ? 'bg-lagos-100 text-lagos-600'
                      : lesson.type === 'PRACTICE'
                        ? 'bg-pradera-100 text-pradera-600'
                        : lesson.type === 'CHALLENGE'
                          ? 'bg-castillo-100 text-castillo-600'
                          : 'bg-volcan-100 text-volcan-600'
                  }`}
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-gray-900">{lesson.title}</p>
                  <p className="truncate text-xs text-gray-400">
                    {lesson.module.course.title} &rsaquo; {lesson.module.title} &middot; Orden{' '}
                    {lesson.order}
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {typeLabel(lesson.type)}
                  </span>
                  <span className="font-candy-beans text-sm text-amber-600">
                    +{lesson.xpReward} XP
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`/dashboard/lessons/${lesson.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-lagos-600"
                    title="Ver lección"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLesson(lesson);
                      setIsClosingLessonForm(false);
                      setShowForm(true);
                    }}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLessonToDelete(lesson.id);
                    }}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {expandedId === lesson.id ? (
                  <ChevronUp className="h-4 w-4 text-gray-300" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-300" />
                )}
              </div>

              {expandedId === lesson.id && (
                <div className="border-t border-gray-50 px-5 py-4">
                  <div className="mb-3 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase text-gray-400">
                        Descripción
                      </h5>
                      {(lesson.content?.description as string) ? (
                        <MarkdownRenderer content={lesson.content?.description as string} />
                      ) : (
                        <span className="text-sm italic text-gray-400">Sin descripción</span>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase text-gray-400">
                        Imagen
                      </h5>
                      {lesson.resources?.image ? (
                        <LessonAssetPreview
                          type="image"
                          sourceUrl={lesson.resources.image.url}
                          fileName={lesson.resources.image.fileName}
                        />
                      ) : (
                        <span className="text-sm italic text-gray-400">Sin imagen</span>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase text-gray-400">
                        PDF
                      </h5>
                      {lesson.resources?.pdf ? (
                        <LessonAssetPreview
                          type="pdf"
                          sourceUrl={lesson.resources.pdf.url}
                          fileName={lesson.resources.pdf.fileName}
                        />
                      ) : (
                        <span className="text-sm italic text-gray-400">Sin PDF</span>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase text-gray-400">
                        Video
                      </h5>
                      {lesson.resources?.video ? (
                        <LessonAssetPreview
                          type="video"
                          sourceUrl={lesson.resources.video.url}
                          fileName={lesson.resources.video.fileName}
                        />
                      ) : (
                        <span className="text-sm italic text-gray-400">Sin video</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase text-gray-400">
                      Ejercicios ({lesson.problems.length})
                    </h5>
                    {lesson.problems.length === 0 ? (
                      <span className="text-sm italic text-gray-400">Ninguno</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {lesson.problems.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                          >
                            <span className="font-medium text-gray-800">{p.title}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[p.difficulty] || 'bg-gray-100 text-gray-600'}`}
                            >
                              {p.difficulty}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <ConfirmDialog
        open={Boolean(lessonToDelete)}
        title="¿Eliminar esta lección?"
        description={`Eliminarás ${lessons.find((lesson) => lesson.id === lessonToDelete)?.title ?? 'esta lección'} de forma permanente. Esta acción no se puede deshacer.`}
        isPending={deleteLessonMutation.isPending}
        onCancel={() => setLessonToDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
