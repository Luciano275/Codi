'use client';

import { useParams } from 'next/navigation';
import AdminLessonsPage from '@/app/dashboard/admin/lessons/page';
import { useAdminIsland } from '@/hooks/queries/useAdminIslands';

export default function IslandModuleLessonsPage() {
  const { id, courseId, moduleId } = useParams<{
    id: string;
    courseId: string;
    moduleId: string;
  }>();
  const islandQuery = useAdminIsland(id);
  return (
    <AdminLessonsPage
      context={{ islandId: id, islandTitle: islandQuery.data?.title, courseId, moduleId }}
    />
  );
}
