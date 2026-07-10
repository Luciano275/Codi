'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Loader2, FileText, BookOpen, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, ChevronRight, X,
} from 'lucide-react';
import MarkdownRenderer from '@/components/dashboard/MarkdownRenderer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { adminFetch } from '@/lib/admin-api';
import { LessonForm } from '@/components/admin/LessonForm';

type LessonType = 'THEORY' | 'PRACTICE' | 'CHALLENGE' | 'EXAM';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

interface Course {
  id: string;
  title: string;
  modules: { id: string; title: string }[];
}

interface Problem {
  id: string;
  cmsTaskId: number;
  cmsTaskName: string;
  title: string;
  difficulty: Difficulty;
  xpReward: number;
  gemsReward: number;
}

interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  order: number;
  xpReward: number;
  content: Record<string, unknown>;
  module: { id: string; title: string; course: { id: string; title: string } };
  problems: Problem[];
}

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

export default function AdminLessonsPage() {
  const searchParams = useSearchParams();
  const filterModuleId = searchParams.get('moduleId') || '';
  const filterCourseId = searchParams.get('courseId') || '';

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [initialFormCourseId, setInitialFormCourseId] = useState('');
  const [initialFormModuleId, setInitialFormModuleId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [lessonsData, coursesData, problemsData] = await Promise.all([
        adminFetch<Lesson[]>('/api/admin/lessons'),
        adminFetch<Course[]>('/api/courses'),
        adminFetch<Problem[]>('/api/admin/problems'),
      ]);
      setLessons(lessonsData);
      setCourses(coursesData);
      setAllProblems(problemsData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateProblem = useCallback(async (problemId: string, updates: Partial<Problem>) => {
    try {
      await adminFetch(`/api/admin/problems/${problemId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setAllProblems((prev) =>
        prev.map((p) => (p.id === problemId ? { ...p, ...updates } : p)),
      );
    } catch {}
  }, []);

  const handleCreate = async (data: any) => {
    await adminFetch('/api/admin/lessons', { method: 'POST', body: JSON.stringify(data) });
    setShowForm(false);
    await loadData();
  };

  const handleUpdate = async (data: any) => {
    if (!editingLesson) return;
    await adminFetch(`/api/admin/lessons/${editingLesson.id}`, { method: 'PATCH', body: JSON.stringify(data) });
    setEditingLesson(null);
    setShowForm(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta lección? Esta acción no se puede deshacer.')) return;
    await adminFetch(`/api/admin/lessons/${id}`, { method: 'DELETE' });
    await loadData();
  };

  const typeLabel = (t: LessonType) => LESSON_TYPES.find((x) => x.value === t)?.label ?? t;

  if (loading) {
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
  const filterModule = filterCourse?.modules.find((m) => m.id === filterModuleId);

  return (
    <div className="mx-auto max-w-5xl">
      {filterCourse && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/dashboard/admin/courses" className="transition-colors hover:text-lagos-600">Cursos</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/dashboard/admin/courses/${filterCourse.id}`} className="transition-colors hover:text-lagos-600">{filterCourse.title}</Link>
          {filterModule && <><ChevronRight className="h-3.5 w-3.5" /><span className="text-gray-600">{filterModule.title}</span></>}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-super-pandora text-2xl text-gray-900">Gestión de Lecciones</h1>
          <p className="font-simply-olive mt-0.5 text-sm text-gray-500">Creá y administrá las lecciones de la plataforma</p>
        </div>
        <button
          onClick={() => { setEditingLesson(null); setInitialFormCourseId(filterCourseId); setInitialFormModuleId(filterModuleId); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-pradera-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pradera-600"
        >
          <Plus className="h-4 w-4" />Nueva lección
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 pt-10 pb-10">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-super-pandora text-lg text-gray-800">{editingLesson ? 'Editar lección' : 'Nueva lección'}</h2>
              <button onClick={() => { setShowForm(false); setEditingLesson(null); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <LessonForm
              lesson={editingLesson}
              courses={courses}
              allProblems={allProblems}
              onSave={editingLesson ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingLesson(null); }}
              initialCourseId={initialFormCourseId}
              initialModuleId={initialFormModuleId}
              onUpdateProblem={updateProblem}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {displayedLessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-simply-olive text-gray-500">{filterModuleId ? 'Este módulo no tiene lecciones.' : 'No hay lecciones aún. Creá la primera.'}</p>
          </div>
        ) : (
          displayedLessons.map((lesson) => (
            <div key={lesson.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(expandedId === lesson.id ? null : lesson.id); } }}
                className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  lesson.type === 'THEORY' ? 'bg-lagos-100 text-lagos-600' : lesson.type === 'PRACTICE' ? 'bg-pradera-100 text-pradera-600' : lesson.type === 'CHALLENGE' ? 'bg-castillo-100 text-castillo-600' : 'bg-volcan-100 text-volcan-600'
                }`}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-gray-900">{lesson.title}</p>
                  <p className="truncate text-xs text-gray-400">{lesson.module.course.title} &rsaquo; {lesson.module.title} &middot; Orden {lesson.order}</p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{typeLabel(lesson.type)}</span>
                  <span className="font-candy-beans text-sm text-amber-600">+{lesson.xpReward} XP</span>
                </div>
                <div className="flex items-center gap-1">
                  <a href={`/dashboard/lessons/${lesson.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-lagos-600" title="Ver lección">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button onClick={(e) => { e.stopPropagation(); setEditingLesson(lesson); setShowForm(true); }} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); }} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {expandedId === lesson.id ? <ChevronUp className="h-4 w-4 text-gray-300" /> : <ChevronDown className="h-4 w-4 text-gray-300" />}
              </div>

              {expandedId === lesson.id && (
                <div className="border-t border-gray-50 px-5 py-4">
                  <div className="mb-3 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">Descripción</h5>
                      {(lesson.content?.description as string) ? <MarkdownRenderer content={lesson.content?.description as string} /> : <span className="text-sm italic text-gray-400">Sin descripción</span>}
                    </div>
                    <div>
                      <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">PDF</h5>
                      {(lesson.content?.pdfUrl as string) ? (
                        <a href={lesson.content?.pdfUrl as string} target="_blank" rel="noopener noreferrer" className="text-sm text-lagos-600 underline hover:text-lagos-700">Ver PDF</a>
                      ) : <span className="text-sm italic text-gray-400">Sin PDF</span>}
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">Ejercicios ({lesson.problems.length})</h5>
                    {lesson.problems.length === 0 ? (
                      <span className="text-sm italic text-gray-400">Ninguno</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {lesson.problems.map((p) => (
                          <span key={p.id} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs">
                            <span className="font-medium text-gray-800">{p.title}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[p.difficulty] || 'bg-gray-100 text-gray-600'}`}>{p.difficulty}</span>
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
    </div>
  );
}
