import { notFound } from 'next/navigation';
import { serverFetch, type AdminIsland } from '@/lib/server-api';
import ModulesClient from '@/app/dashboard/admin/courses/[id]/modules-client';

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

export default async function IslandCoursePage({
  params,
}: {
  params: Promise<{ id: string; courseId: string }>;
}) {
  const { id, courseId } = await params;
  const [island, course] = await Promise.all([
    serverFetch<AdminIsland>(`/api/admin/islands/${id}`),
    serverFetch<CourseWithModules>(`/api/admin/courses/${courseId}`),
  ]).catch(() => notFound());

  if (!island.courses?.some((candidate) => candidate.id === course.id)) notFound();
  return <ModulesClient course={course} island={{ id: island.id, title: island.title }} />;
}
