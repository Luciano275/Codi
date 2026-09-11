'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Files, Layers3, Loader2, Plus, Save, X } from '@/components/ui/Icon';
import { useCreateCourse, useDeleteCourse, useUpdateCourse } from '@/hooks/queries/useAdminCourses';
import type { AdminIsland, AdminIslandCourse } from '@/lib/server-api';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const CreateModuleDialog = dynamic(
  () => import('./CreateModuleDialog').then((module) => module.CreateModuleDialog),
  { ssr: false },
);

type CourseFormData = Pick<AdminIslandCourse, 'title' | 'level' | 'region' | 'xpReward' | 'order'>;

export function IslandModulesPanel({ island }: { island: AdminIsland }) {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const courses = island.courses ?? [];
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminIslandCourse | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<AdminIslandCourse | null>(null);
  const [error, setError] = useState('');

  async function removeCourse() {
    if (!courseToDelete) return;
    setError('');
    try {
      await deleteCourse.mutateAsync(courseToDelete.id);
      setCourseToDelete(null);
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el curso');
    }
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border-2 border-pradera-100 bg-[#fffdf7] shadow-[0_10px_0_rgba(212,240,189,0.72),0_20px_42px_rgba(34,91,45,0.1)]">
      <header className="border-b-2 border-pradera-100 bg-pradera-50 px-7 py-8 sm:px-9">
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
          <div className="flex items-center gap-3 rounded-2xl border border-pradera-100 bg-pradera-50 px-4 py-3 text-sm text-bosque-700 shadow-[0_3px_0_rgba(212,240,189,0.9)]">
            <Files className="h-5 w-5 text-pradera-600" />
            <span>
              <strong className="text-gray-900">{courses.length}</strong>{' '}
              {courses.length === 1 ? 'módulo' : 'módulos'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatingCourse(true)}
          className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-2xl border-b-4 border-pradera-700 bg-pradera-500 px-5 py-3 text-sm font-bold text-white transition hover:translate-y-0.5 hover:border-b-2 hover:bg-pradera-600"
        >
          <Plus className="h-4 w-4" /> Nuevo módulo
        </button>
      </header>
      <div className="px-5 py-7 sm:px-8 sm:py-9">
        {error && (
          <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}
        <div className="space-y-7">
          {courses.map((course) => (
            <article
              key={course.id}
              className="overflow-hidden rounded-[1.7rem] border-2 border-pradera-100 bg-white shadow-[0_4px_0_rgba(230,246,213,0.85)] transition hover:-translate-y-0.5 hover:border-pradera-200 hover:shadow-[0_7px_0_rgba(212,240,189,0.9)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-5 border-b-2 border-pradera-50 px-6 py-6 sm:px-7">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-pradera-200 bg-pradera-100 font-super-pandora text-lg text-pradera-700 shadow-[0_3px_0_rgba(186,229,150,0.9)]">
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
                <div className="flex items-center gap-1 rounded-2xl bg-pradera-50 p-1.5">
                  <Link
                    href={`/dashboard/admin/islands/${island.id}/courses/${course.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-bold text-pradera-700 shadow-sm transition hover:bg-pradera-100"
                  >
                    Administrar <span aria-hidden="true">›</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditingCourse(course)}
                    aria-label={`Editar ${course.title}`}
                    className="cursor-pointer rounded-xl px-2 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-pradera-100 hover:text-pradera-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseToDelete(course)}
                    aria-label={`Eliminar ${course.title}`}
                    className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="bg-pradera-50/60 px-6 py-5 sm:px-7">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-bosque-600/65">
                  Submódulos y lecciones
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {course.modules.map((module) => (
                    <Link
                      key={module.id}
                      href={`/dashboard/admin/islands/${island.id}/courses/${course.id}/modules/${module.id}/lessons`}
                      className="group flex min-h-20 items-center justify-between rounded-2xl border border-pradera-100 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-pradera-300 hover:bg-pradera-50"
                    >
                      <span className="flex items-center gap-2 text-gray-600">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full bg-pradera-600"
                          aria-hidden="true"
                        />
                        <span>
                          <strong className="block font-semibold text-gray-800">
                            {module.title}
                          </strong>
                          <span className="mt-0.5 block text-xs text-gray-400">
                            Submódulo {module.order}
                          </span>
                        </span>
                      </span>
                      <span className="ml-3 whitespace-nowrap text-xs font-semibold text-gray-500 group-hover:text-pradera-700">
                        {module._count.lessons}{' '}
                        {module._count.lessons === 1 ? 'lección' : 'lecciones'}
                      </span>
                    </Link>
                  ))}
                  {course.modules.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-pradera-200 bg-white px-5 py-6 text-sm text-gray-400 md:col-span-2">
                      Este módulo todavía no tiene submódulos. Abrí <strong>{course.title}</strong>{' '}
                      para crear el primero.
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!courses.length && (
            <div className="rounded-[1.7rem] border-2 border-dashed border-pradera-200 bg-pradera-50 px-6 py-14 text-center">
              <Layers3 className="mx-auto h-9 w-9 text-pradera-400" />
              <p className="mt-4 font-super-pandora text-xl text-bosque-800">
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
              router.refresh();
            } catch (updateError) {
              setError(
                updateError instanceof Error ? updateError.message : 'No se pudo editar el módulo',
              );
              throw updateError;
            }
          }}
        />
      )}
      {isCreatingCourse && (
        <CreateModuleDialog
          isOpen
          isSaving={createCourse.isPending}
          initialOrder={Math.max(1, ...courses.map((course) => course.order + 1))}
          onClose={() => setIsCreatingCourse(false)}
          onSubmit={async (data) => {
            setError('');
            try {
              await createCourse.mutateAsync({ ...data, islandId: island.id });
              router.refresh();
            } catch (createError) {
              setError(
                createError instanceof Error ? createError.message : 'No se pudo crear el módulo',
              );
              throw createError;
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
    level: course.level,
    region: course.region,
    xpReward: course.xpReward,
    order: course.order,
  });
  const [isClosing, setIsClosing] = useState(false);

  function closeDialog() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(onCancel, 160);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onSave(form);
      closeDialog();
    } catch {}
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bosque-950/40 px-4 backdrop-blur-sm ${isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter'}`}
    >
      <form
        onSubmit={(event) => void submitForm(event)}
        className={`w-full max-w-lg rounded-[2rem] border-2 border-pradera-200 bg-[#fffdf7] p-6 shadow-[0_14px_0_rgba(27,116,32,0.85),0_28px_55px_rgba(13,46,24,0.28)] ${isClosing ? 'modal-content-exit' : 'modal-content-enter'}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-super-pandora text-lg text-gray-900">Editar módulo</h2>
          <button
            type="button"
            onClick={closeDialog}
            className="cursor-pointer rounded-xl p-1.5 text-gray-400 transition hover:bg-pradera-100 hover:text-pradera-700"
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
            onClick={closeDialog}
            className="cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-500 transition hover:bg-pradera-50 hover:text-bosque-700"
          >
            Cancelar
          </button>
          <button
            disabled={isSaving || !form.title}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border-b-4 border-pradera-700 bg-pradera-500 px-5 py-2.5 text-sm font-bold text-white transition hover:translate-y-0.5 hover:border-b-2 hover:bg-pradera-600 disabled:cursor-not-allowed disabled:opacity-50"
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
        className="w-full rounded-2xl border-2 border-pradera-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-pradera-400 focus:ring-4 focus:ring-pradera-100"
      />
    </label>
  );
}
