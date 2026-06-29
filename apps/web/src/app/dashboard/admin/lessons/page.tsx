'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  BookOpen,
  AlertCircle,
  Search,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import MarkdownRenderer from '@/components/dashboard/MarkdownRenderer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('codi_token');
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

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

function LessonForm({
  lesson,
  courses,
  allProblems,
  onSave,
  onCancel,
}: {
  lesson?: Lesson | null;
  courses: Course[];
  allProblems: Problem[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [type, setType] = useState<LessonType>(lesson?.type ?? 'THEORY');
  const [courseId, setCourseId] = useState(lesson?.module.course.id ?? '');
  const [moduleId, setModuleId] = useState(lesson?.module.id ?? '');
  const [order, setOrder] = useState(lesson?.order ?? 1);
  const [xpReward, setXpReward] = useState(lesson?.xpReward ?? 50);
  const [description, setDescription] = useState(
    (lesson?.content?.description as string) ?? '',
  );
  const [pdfUrl, setPdfUrl] = useState(
    (lesson?.content?.pdfUrl as string) ?? '',
  );
  const [instructions, setInstructions] = useState(
    (lesson?.content?.instructions as string) ?? '',
  );
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>(
    lesson?.problems.map((p) => p.id) ?? [],
  );
  const [problemSearch, setProblemSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showProblemPicker, setShowProblemPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const filteredCourses = courses.filter((c) => c.modules.length > 0);
  const selectedCourse = courses.find((c) => c.id === courseId);
  const availableModules = selectedCourse?.modules ?? [];

  const filteredProblems = allProblems.filter(
    (p) =>
      p.title.toLowerCase().includes(problemSearch.toLowerCase()) ||
      p.cmsTaskName.toLowerCase().includes(problemSearch.toLowerCase()),
  );

  const toggleProblem = (id: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId || !title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        type,
        moduleId,
        order,
        xpReward,
        content: {
          description: description.trim(),
          pdfUrl: pdfUrl.trim(),
          instructions: instructions.trim(),
        },
        problemIds: selectedProblemIds,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none ring-0 transition-colors focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
            placeholder="Nombre de la lección"
          />
        </div>

        {/* Type */}
        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LessonType)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
          >
            {LESSON_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Course */}
        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Curso
          </label>
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setModuleId('');
            }}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
          >
            <option value="">Seleccionar curso</option>
            {filteredCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Module */}
        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Módulo
          </label>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            required
            disabled={!courseId}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Seleccionar módulo</option>
            {availableModules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        {/* Order */}
        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Orden
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
            min={1}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
          />
        </div>

        {/* XP Reward */}
        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            XP Recompensa
          </label>
          <input
            type="number"
            value={xpReward}
            onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
          />
        </div>
      </div>

      {/* Content fields */}
      <div className="space-y-4">
        <h4 className="font-super-pandora text-sm text-gray-700">Contenido</h4>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="font-simply-olive text-sm font-medium text-gray-600">
              Descripción (Markdown)
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-lagos-600"
            >
              {showPreview ? (
                <><Edit3 className="h-3.5 w-3.5" /> Editar</>
              ) : (
                <><Eye className="h-3.5 w-3.5" /> Vista previa</>
              )}
            </button>
          </div>
          {showPreview ? (
            <div className="min-h-[100px] rounded-xl border border-gray-200 bg-white px-4 py-3">
              <MarkdownRenderer content={description} />
            </div>
          ) : (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
              placeholder="Escribí el contenido en Markdown..."
            />
          )}
        </div>

        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-600">
            URL del PDF (opcional)
          </label>
          <input
            type="url"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
            placeholder="https://ejemplo.com/material.pdf"
          />
        </div>

        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-600">
            Instrucciones adicionales (opcional)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
            placeholder="Instrucciones para el estudiante"
          />
        </div>
      </div>

      {/* Problem selector */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-super-pandora text-sm text-gray-700">
            Ejercicios ({selectedProblemIds.length} seleccionados)
          </h4>
          <button
            type="button"
            onClick={() => setShowProblemPicker(!showProblemPicker)}
            className="flex items-center gap-1 text-sm font-medium text-lagos-600 hover:text-lagos-700"
          >
            {showProblemPicker ? 'Ocultar' : 'Buscar ejercicios'}
            {showProblemPicker ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Selected problems chips */}
        {selectedProblemIds.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedProblemIds.map((pid) => {
              const p = allProblems.find((x) => x.id === pid);
              return (
                <span
                  key={pid}
                  className="inline-flex items-center gap-1 rounded-lg bg-pradera-50 px-2.5 py-1 text-xs font-medium text-pradera-700"
                >
                  #{p?.cmsTaskId} {p?.title}
                  <button
                    type="button"
                    onClick={() => toggleProblem(pid)}
                    className="ml-0.5 text-pradera-400 hover:text-pradera-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {showProblemPicker && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-lagos-400"
                placeholder="Buscar ejercicios..."
              />
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filteredProblems.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">
                  Sin resultados
                </p>
              ) : (
                filteredProblems.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProblemIds.includes(p.id)}
                      onChange={() => toggleProblem(p.id)}
                      className="h-4 w-4 rounded border-gray-300 text-pradera-500 focus:ring-pradera-300"
                    />
                    <span className="flex-1">
                      <span className="font-medium text-gray-800">
                        {p.title}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        #{p.cmsTaskId}
                      </span>
                    </span>
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      {p.difficulty}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !moduleId || !title.trim()}
          className="flex items-center gap-2 rounded-xl bg-pradera-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pradera-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {lesson ? 'Guardar cambios' : 'Crear lección'}
        </button>
      </div>
    </form>
  );
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [lessonsData, coursesData, problemsData] = await Promise.all([
        apiFetch<Lesson[]>('/api/admin/lessons'),
        apiFetch<Course[]>('/api/courses'),
        apiFetch<Problem[]>('/api/admin/problems'),
      ]);
      setLessons(lessonsData);
      setCourses(coursesData);
      setAllProblems(problemsData);
    } catch (e: any) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (data: any) => {
    await apiFetch('/api/admin/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setShowForm(false);
    await loadData();
  };

  const handleUpdate = async (data: any) => {
    if (!editingLesson) return;
    await apiFetch(`/api/admin/lessons/${editingLesson.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setEditingLesson(null);
    setShowForm(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta lección? Esta acción no se puede deshacer.')) return;
    await apiFetch(`/api/admin/lessons/${id}`, { method: 'DELETE' });
    await loadData();
  };

  const typeLabel = (t: LessonType) =>
    LESSON_TYPES.find((x) => x.value === t)?.label ?? t;

  const difficultyColor = (d: Difficulty) => {
    const colors: Record<string, string> = {
      EASY: 'bg-pradera-100 text-pradera-700',
      MEDIUM: 'bg-desierto-100 text-desierto-700',
      HARD: 'bg-volcan-100 text-volcan-700',
      EXPERT: 'bg-bosque-100 text-bosque-700',
    };
    return colors[d] ?? 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-lagos-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-super-pandora text-2xl text-gray-900">
            Gestión de Lecciones
          </h1>
          <p className="font-simply-olive mt-0.5 text-sm text-gray-500">
            Creá y administrá las lecciones de la plataforma
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLesson(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-pradera-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pradera-600"
        >
          <Plus className="h-4 w-4" />
          Nueva lección
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 pt-10 pb-10">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-super-pandora text-lg text-gray-800">
                {editingLesson ? 'Editar lección' : 'Nueva lección'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingLesson(null);
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <LessonForm
              lesson={editingLesson}
              courses={courses}
              allProblems={allProblems}
              onSave={editingLesson ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingLesson(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Lessons list */}
      <div className="space-y-3">
        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-simply-olive text-gray-500">
              No hay lecciones aún. Creá la primera.
            </p>
          </div>
        ) : (
          lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setExpandedId(expandedId === lesson.id ? null : lesson.id)
                }
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
                  <p className="truncate font-semibold text-gray-900">
                    {lesson.title}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {lesson.module.course.title} &rsaquo; {lesson.module.title}{' '}
                    &middot; Orden {lesson.order}
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
                      handleDelete(lesson.id);
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
                      <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Descripción
                      </h5>
                      {(lesson.content?.description as string) ? (
                        <MarkdownRenderer content={lesson.content?.description as string} />
                      ) : (
                        <span className="text-sm italic text-gray-400">Sin descripción</span>
                      )}
                    </div>
                    <div>
                      <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">
                        PDF
                      </h5>
                      {(lesson.content?.pdfUrl as string) ? (
                        <a
                          href={lesson.content?.pdfUrl as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-lagos-600 underline hover:text-lagos-700"
                        >
                          Ver PDF
                        </a>
                      ) : (
                        <span className="text-sm italic text-gray-400">
                          Sin PDF
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-1 font-simply-olive text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Ejercicios ({lesson.problems.length})
                    </h5>
                    {lesson.problems.length === 0 ? (
                      <span className="text-sm italic text-gray-400">
                        Ninguno
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {lesson.problems.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                          >
                            <span className="font-medium text-gray-800">
                              {p.title}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${difficultyColor(p.difficulty)}`}
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
    </div>
  );
}
