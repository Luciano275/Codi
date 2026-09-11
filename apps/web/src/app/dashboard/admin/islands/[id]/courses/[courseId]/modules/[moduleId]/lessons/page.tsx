import { notFound } from 'next/navigation';
import AdminLessonsClient from '@/app/dashboard/admin/lessons/admin-lessons-client';
import { fetchAdminIsland, serverFetch } from '@/lib/server-api';
import type { AdminCourse, AdminLesson, AdminProblem } from '@/hooks/queries/useAdminLessons';

export default async function IslandModuleLessonsPage({
  params,
}: {
  params: Promise<{ id: string; courseId: string; moduleId: string }>;
}) {
  const { id, courseId, moduleId } = await params;
  const [island, lessons, courses, problems] = await Promise.all([
    fetchAdminIsland(id),
    serverFetch<AdminLesson[]>('/api/admin/lessons'),
    serverFetch<AdminCourse[]>('/api/courses'),
    serverFetch<AdminProblem[]>('/api/admin/problems'),
  ]).catch(() => notFound());

  return (
    <AdminLessonsClient
      context={{ islandId: id, islandTitle: island.title, courseId, moduleId }}
      initialLessons={lessons}
      initialCourses={courses}
      initialProblems={problems}
    />
  );
}
