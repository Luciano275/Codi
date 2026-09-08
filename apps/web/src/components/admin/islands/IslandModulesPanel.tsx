'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Files,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useDeleteCourse, useUpdateCourse } from '@/hooks/queries/useAdminCourses';
import type { AdminIsland, AdminIslandCourse } from '@/lib/server-api';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type CourseFormData = Pick<
  AdminIslandCourse,
  'title' | 'slug' | 'level' | 'region' | 'xpReward' | 'order'
>;

export function IslandModulesPanel({ island }: { island: AdminIsland }) {
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const courses = island.courses ?? [];
  const [editingCourse, setEditingCourse] = useState<AdminIslandCourse | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<AdminIslandCourse | null>(null);
  const [error, setError] = useState('');

  async function removeCourse() {
    if (!courseToDelete) return;
    setError('');
    try {
      await deleteCourse.mutateAsync(courseToDelete.id);
      setCourseToDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el curso');
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <header className="border-b border-gray-100 px-7 py-8 sm:px-9">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div
              className="mb-3 h-1.5 w-12 rounded-full"
              style={{ backgroundColor: island.accent }}
            />
            <h1 className="font-super-pandora text-3xl text-gray-900">{island.title}</h1>
            <p className="mt-3 text-base leading-relaxed text-gray-500">
              Organizá los módulos, sus submódulos y las lecciones que los alumnos recorrerán.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-lagos-50 px-4 py-3 text-sm text-gray-600">
            <Files className="h-5 w-5 text-lagos-500" />
            <span>
              <strong className="text-gray-900">{courses.length}</strong>{' '}
              {courses.length === 1 ? 'módulo' : 'módulos'}
            </span>
          </div>
        </div>
        <Link
          href={`/dashboard/admin/islands/${island.id}/courses/new`}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-lagos-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-lagos-600"
        >
          <Plus className="h-4 w-4" /> Nuevo módulo
        </Link>
      </header>
      <div className="px-5 py-7 sm:px-8 sm:py-9">
        {error && (
          <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}
        <div className="space-y-7">
          {courses.map((course) => (
            <article
              key={course.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-5 border-b border-gray-100 px-6 py-6 sm:px-7">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lagos-100 font-super-pandora text-lg text-lagos-700">
                    {course.order}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Módulo</p>
                    <h2 className="mt-1 font-super-pandora text-xl text-gray-900 sm:text-2xl">
                      {course.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>Nivel {course.level}</span>
                      <span>{course.region}</span>
                      <span>{course.xpReward} XP</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-gray-50 p-1">
                  <Link
                    href={`/dashboard/admin/islands/${island.id}/courses/${course.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-lagos-600 shadow-sm transition hover:bg-lagos-50"
                  >
                    Administrar <ChevronRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditingCourse(course)}
                    aria-label={`Editar ${course.title}`}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseToDelete(course)}
                    aria-label={`Eliminar ${course.title}`}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-5 sm:px-7">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
                  <ClipboardList className="h-4 w-4" /> Submódulos y lecciones
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {course.modules.map((module) => (
                    <Link
                      key={module.id}
                      href={`/dashboard/admin/islands/${island.id}/courses/${course.id}/modules/${module.id}/lessons`}
                      className="group flex min-h-20 items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-lagos-200 hover:bg-lagos-50"
                    >
                      <span className="flex items-center gap-2 text-gray-600">
                        <BookOpen className="h-5 w-5 shrink-0 text-lagos-500" />
                        <span>
                          <strong className="block font-semibold text-gray-800">
                            {module.title}
                          </strong>
                          <span className="mt-0.5 block text-xs text-gray-400">
                            Submódulo {module.order}
                          </span>
                        </span>
                      </span>
                      <span className="ml-3 whitespace-nowrap text-xs font-semibold text-gray-500 group-hover:text-lagos-600">
                        {module._count.lessons}{' '}
                        {module._count.lessons === 1 ? 'lección' : 'lecciones'}
                      </span>
                    </Link>
                  ))}
                  {course.modules.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-6 text-sm text-gray-400 md:col-span-2">
                      Este módulo todavía no tiene submódulos. Abrí <strong>{course.title}</strong>{' '}
                      para crear el primero.
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!courses.length && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
              <Layers3 className="mx-auto h-9 w-9 text-gray-300" />
              <p className="mt-4 font-super-pandora text-xl text-gray-700">
                Todavía no hay módulos
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-400">
                Creá el primer módulo para empezar a construir el recorrido de esta isla.
              </p>
            </div>
          )}
        </div>
      </div>
      {editingCourse && (
        <CourseEditor
          course={editingCourse}
          isSaving={updateCourse.isPending}
          onCancel={() => setEditingCourse(null)}
          onSave={async (data) => {
            setError('');
            try {
              await updateCourse.mutateAsync({
                id: editingCourse.id,
                ...data,
                islandId: island.id,
              });
              setEditingCourse(null);
            } catch (updateError) {
              setError(
                updateError instanceof Error ? updateError.message : 'No se pudo editar el módulo',
              );
            }
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(courseToDelete)}
        title="¿Eliminar este módulo?"
        description={`También se eliminarán los submódulos y lecciones de ${courseToDelete?.title ?? 'este módulo'}. Esta acción no se puede deshacer.`}
        isPending={deleteCourse.isPending}
        onCancel={() => setCourseToDelete(null)}
        onConfirm={() => void removeCourse()}
      />
    </section>
  );
}

function CourseEditor({
  course,
  isSaving,
  onCancel,
  onSave,
}: {
  course: AdminIslandCourse;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (data: CourseFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<CourseFormData>({
    title: course.title,
    slug: course.slug,
    level: course.level,
    region: course.region,
    xpReward: course.xpReward,
    order: course.order,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(form);
        }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-super-pandora text-lg text-gray-900">Editar módulo</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <CourseField
            label="Título"
            value={form.title}
            onChange={(title) => setForm({ ...form, title })}
            className="md:col-span-2"
          />
          <CourseField
            label="Slug"
            value={form.slug}
            onChange={(slug) => setForm({ ...form, slug: slug.toLowerCase() })}
            className="md:col-span-2"
          />
          <CourseField
            label="Nivel"
            type="number"
            min={1}
            value={form.level}
            onChange={(level) => setForm({ ...form, level: Number(level) })}
          />
          <CourseField
            label="Región"
            value={form.region}
            onChange={(region) => setForm({ ...form, region })}
          />
          <CourseField
            label="XP"
            type="number"
            min={0}
            value={form.xpReward}
            onChange={(xpReward) => setForm({ ...form, xpReward: Number(xpReward) })}
          />
          <CourseField
            label="Orden"
            type="number"
            min={1}
            value={form.order}
            onChange={(order) => setForm({ ...form, order: Number(order) })}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            disabled={isSaving || !form.title || !form.slug}
            className="inline-flex items-center gap-2 rounded-xl bg-lagos-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lagos-600 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{' '}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

function CourseField({
  label,
  value,
  onChange,
  type = 'text',
  min,
  className = '',
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <input
        required
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-lagos-500"
      />
    </label>
  );
}
