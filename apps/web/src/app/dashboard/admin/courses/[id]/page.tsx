import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import { AdminListSkeleton } from '@/components/admin/skeleton';
import ModulesClient from './modules-client';

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

async function ModulesContent({ courseId }: { courseId: string }) {
  let course: CourseWithModules;
  try {
    course = await serverFetch<CourseWithModules>(`/api/admin/courses/${courseId}`);
  } catch {
    notFound();
  }

  return <ModulesClient course={course} />;
}

export default async function AdminCourseModulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <Suspense fallback={<AdminListSkeleton />}>
        <ModulesContent courseId={id} />
      </Suspense>
    </div>
  );
}
