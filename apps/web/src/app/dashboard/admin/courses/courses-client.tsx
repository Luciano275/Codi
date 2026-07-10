'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Save, X, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import {
  useAdminCoursesList,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from '@/hooks/queries/useAdminCourses';
import type { AdminCourse } from '@/hooks/queries/useAdminCourses';

interface CourseFormData {
  title: string;
  slug: string;
  level: number;
  region: string;
  xpReward: number;
  order: number;
}

const emptyForm: CourseFormData = {
  title: '',
  slug: '',
  level: 1,
  region: 'intro',
  xpReward: 100,
  order: 1,
};

export default function CoursesClient({ courses: initial }: { courses: AdminCourse[] }) {
  const { data: coursesData } = useAdminCoursesList();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  const courses = coursesData ?? initial;

  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CourseFormData>(emptyForm);

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(c: AdminCourse) {
    setForm({
      title: c.title,
      slug: c.slug,
      level: c.level,
      region: c.region,
      xpReward: c.xpReward,
      order: c.order,
    });
    setEditing(c.id);
    setShowForm(true);
  }

  async function handleSave() {
    setError('');
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing, ...form });
      } else {
        await createMutation.mutateAsync(form);
      }
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este curso? Se eliminarán todos sus módulos y lecciones.')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-simply-olive text-sm text-gray-400">{courses.length} cursos</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-lagos-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lagos-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo curso
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-super-pandora text-lg text-gray-900">{editing ? 'Editar curso' : 'Nuevo curso'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Título</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-lagos-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-lagos-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Nivel</label>
                  <input type="number" min={1} value={form.level} onChange={(e) => setForm({ ...form, level: +e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-lagos-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">XP</label>
                  <input type="number" min={0} value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: +e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-lagos-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Orden</label>
                  <input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-lagos-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Región</label>
                <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-lagos-500" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending || !form.title || !form.slug} className="flex items-center gap-2 rounded-xl bg-lagos-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lagos-600 disabled:opacity-50">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                {editing ? 'Guardar cambios' : 'Crear curso'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {courses.map((c) => (
          <Link key={c.id} href={`/dashboard/admin/courses/${c.id}`} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lagos-50 text-lagos-600">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-gray-900">{c.title}</p>
              <p className="text-xs text-gray-400">Nivel {c.level} &middot; {c._count?.modules ?? 0} módulos &middot; Orden {c.order}</p>
            </div>
            <button onClick={() => openEdit(c)} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(c.id)} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          </Link>
        ))}
        {courses.length === 0 && <p className="py-10 text-center text-sm text-gray-400">No hay cursos todavía.</p>}
      </div>
    </div>
  );
}
