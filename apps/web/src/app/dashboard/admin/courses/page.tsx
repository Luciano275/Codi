import { Suspense } from 'react';
import { serverFetch } from '@/lib/server-api';
import { AdminListSkeleton } from '@/components/admin/skeleton';
import type { AdminCourse } from '@/hooks/queries/useAdminCourses';
import CoursesClient from './courses-client';

async function CoursesContent() {
  let courses: AdminCourse[] = [];
  try {
    courses = await serverFetch<AdminCourse[]>('/api/admin/courses');
  } catch {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        Error al cargar los cursos
      </div>
    );
  }

  return <CoursesClient courses={courses} />;
}

export default function AdminCoursesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-super-pandora text-2xl text-gray-900">Cursos</h1>
        <p className="font-simply-olive mt-0.5 text-sm text-gray-400">
          Administrá los cursos de la plataforma
        </p>
      </div>

      <Suspense fallback={<AdminListSkeleton />}>
        <CoursesContent />
      </Suspense>
    </div>
  );
}
