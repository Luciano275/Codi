'use client';

import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRouter } from '@bprogress/next';
import { useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface CourseFormData {
  title: string;
  slug: string;
  level: number;
  region: string;
  xpReward: number;
  order: number;
}

const initialForm: CourseFormData = {
  title: '',
  slug: '',
  level: 1,
  region: 'intro',
  xpReward: 100,
  order: 1,
};

export default function NewIslandCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function createCourse(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const course = await adminFetch<{ id: string }>('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ ...form, islandId: id }),
      });
      router.push(`/dashboard/admin/islands/${id}/courses/${course.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el curso');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/admin/islands/${id}`}
        className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-lagos-600"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a la isla
      </Link>
      <h1 className="font-super-pandora text-2xl text-gray-900">Nuevo curso</h1>
      <p className="mb-6 mt-1 text-sm text-gray-400">
        Este curso quedará asociado a la isla actual.
      </p>
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <form
        onSubmit={createCourse}
        className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <CourseInput
          label="Título"
          value={form.title}
          onChange={(title) => setForm({ ...form, title })}
          className="md:col-span-2"
        />
        <CourseInput
          label="Slug"
          value={form.slug}
          onChange={(slug) => setForm({ ...form, slug: slug.toLowerCase() })}
          className="md:col-span-2"
        />
        <CourseInput
          label="Nivel"
          type="number"
          min={1}
          value={form.level}
          onChange={(level) => setForm({ ...form, level: Number(level) })}
        />
        <CourseInput
          label="Región"
          value={form.region}
          onChange={(region) => setForm({ ...form, region })}
        />
        <CourseInput
          label="XP del curso"
          type="number"
          min={0}
          value={form.xpReward}
          onChange={(xpReward) => setForm({ ...form, xpReward: Number(xpReward) })}
        />
        <CourseInput
          label="Orden"
          type="number"
          min={1}
          value={form.order}
          onChange={(order) => setForm({ ...form, order: Number(order) })}
        />
        <button
          type="submit"
          disabled={isSaving || !form.title || !form.slug}
          className="mt-2 flex w-fit items-center gap-2 rounded-xl bg-lagos-500 px-5 py-3 text-sm font-semibold text-white hover:bg-lagos-600 disabled:opacity-50 md:col-span-2"
        >
          <Save className="h-4 w-4" /> {isSaving ? 'Creando…' : 'Crear curso'}
        </button>
      </form>
    </div>
  );
}

function CourseInput({
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
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
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
