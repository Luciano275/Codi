import { Suspense } from 'react';
import { redirect, unstable_rethrow } from 'next/navigation';
import IslandExplorer from '@/components/islands/IslandExplorer';
import type { IslandViewModel } from '@/components/islands/types';
import { DashboardSkeleton } from '@/components/skeletons/dashboard';
import {
  fetchGlobalRanking,
  fetchIslands,
  fetchProgress,
  UnauthorizedError,
  type IslandSummary,
  type ProgressData,
  type RankingUser,
} from '@/lib/server-api';

function calculateIslandProgress(island: IslandSummary, progress: ProgressData) {
  const courseIds = new Set(island.courses.map((course) => course.id));
  const islandProgress = progress.courses.filter((course) => courseIds.has(course.courseId));
  const completed = islandProgress.reduce((total, course) => total + course.completedLessons, 0);
  const lessons = islandProgress.reduce((total, course) => total + course.totalLessons, 0);
  return lessons > 0 ? Math.round((completed / lessons) * 100) : 0;
}

function toIslandViewModel(island: IslandSummary, progress: ProgressData): IslandViewModel {
  return {
    id: island.id,
    title: island.title,
    description: island.description,
    modelPath: `/api/island-model/${island.slug}`,
    available: island.available,
    accent: island.accent,
    href: `/dashboard/islands/${island.slug}`,
    courseCount: island.courses.length,
    moduleCount: island.courses.reduce((total, course) => total + (course._count?.modules ?? 0), 0),
    progress: calculateIslandProgress(island, progress),
  };
}

async function DashboardContent() {
  let islands: IslandSummary[] = [];
  let progress: ProgressData = {
    totalLessons: 0,
    completedLessons: 0,
    completedLessonIds: [],
    courses: [],
  };
  let ranking: RankingUser[] = [];

  try {
    [islands, progress, ranking] = await Promise.all([
      fetchIslands(),
      fetchProgress(),
      fetchGlobalRanking(5),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthorizedError) redirect('/api/auth/logout');
    console.error('Failed to fetch island dashboard data:', error);
  }

  return (
    <IslandExplorer
      islands={islands.map((island) => toIslandViewModel(island, progress))}
      ranking={ranking}
      completedLessons={progress.completedLessons}
      totalLessons={progress.totalLessons}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
