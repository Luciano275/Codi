import { serverFetch } from '@/lib/server-api';
import AdminLessonsClient from './admin-lessons-client';
import type { AdminCourse, AdminLesson, AdminProblem } from '@/hooks/queries/useAdminLessons';

interface LessonSearchParams {
  islandId?: string;
  courseId?: string;
  moduleId?: string;
}

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<LessonSearchParams>;
}) {
  const [context, lessons, courses, problems] = await Promise.all([
    searchParams,
    serverFetch<AdminLesson[]>('/api/admin/lessons'),
    serverFetch<AdminCourse[]>('/api/courses'),
    serverFetch<AdminProblem[]>('/api/admin/problems'),
  ]);

  return (
    <AdminLessonsClient
      context={context}
      initialLessons={lessons}
      initialCourses={courses}
      initialProblems={problems}
    />
  );
}
