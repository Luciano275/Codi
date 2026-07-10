'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Save, X, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-api';

interface CourseWithModules {
  id: string;
  title: string;
  slug: string;
  level: number;
  modules: {
    id: string;
    title: string;
    order: number;
    _count: { lessons: number };
  }[];
}

interface ModuleFormData {
  title: string;
  order: number;
}

const emptyForm: ModuleFormData = { title: '', order: 1 };

export default function ModulesClient({ course: initial }: { course: CourseWithModules }) {
  const [course, setCourse] = useState(initial);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ModuleFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function reload() {
    try {
      setCourse(await adminFetch<CourseWithModules>(`/api/admin/courses/${course.id}`));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al recargar');
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(mod: CourseWithModules['modules'][0]) {
    setForm({ title: mod.title, order: mod.order });
    setEditing(mod.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const body = { ...form, courseId: course.id };
      if (editing) {
        await adminFetch(`/api/admin/modules/${editing}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
      } else {
        await adminFetch('/api/admin/modules', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este módulo? Se eliminarán todas sus lecciones.')) return;
    try {
      await adminFetch(`/api/admin/modules/${id}`, { method: 'DELETE' });
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/dashboard/admin/courses" className="transition-colors hover:text-lagos-600">Cursos</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-600">{course.title}</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-super-pandora text-2xl text-gray-900">{course.title}</h1>
          <p className="font-simply-olive mt-0.5 text-sm text-gray-400">Nivel {course.level} &middot; {course.modules.length} módulos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-lagos-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lagos-600">
          <Plus className="h-4 w-4" />Nuevo módulo
        </button>
      </div>

      {error && <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-super-pandora text-lg text-gray-900">{editing ? 'Editar módulo' : 'Nuevo módulo'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Título</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-lagos-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Orden</label>
                <input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-lagos-500" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.title} className="flex items-center gap-2 rounded-xl bg-lagos-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lagos-600 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                {editing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {course.modules.map((mod) => (
          <Link key={mod.id} href={`/dashboard/admin/lessons?moduleId=${mod.id}&courseId=${course.id}`} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-gray-900">Módulo {mod.order}: {mod.title}</p>
              <p className="text-xs text-gray-400">{mod._count.lessons} lecciones</p>
            </div>
            <button onClick={() => openEdit(mod)} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(mod.id)} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          </Link>
        ))}
        {course.modules.length === 0 && <p className="py-10 text-center text-sm text-gray-400">Este curso no tiene módulos.</p>}
      </div>
    </div>
  );
}
