import { Suspense } from 'react';
import { HelpCircle } from 'lucide-react';
import LearningPath from '@/components/dashboard/LearningPath';
import WeeklyRanking from '@/components/dashboard/WeeklyRanking';
import { auth } from '@/lib/auth';
import {
  fetchCourses,
  fetchProgress,
  fetchGlobalRanking,
  type Course,
  type ProgressData,
  type RankingUser,
} from '@/lib/server-api';
import { DashboardSkeleton } from '@/components/skeletons/dashboard';

function buildStages(courses: Course[], progress: ProgressData) {
  const completedSet = new Set(
    progress.courses.filter((c) => c.completed).map((c) => c.courseId),
  );
  const availableSet = new Set(
    (() => {
      let foundIncomplete = false;
      return progress.courses.filter((c) => {
        if (foundIncomplete) return false;
        if (!c.completed) {
          foundIncomplete = true;
          return true;
        }
        return false;
      }).map((c) => c.courseId);
    })(),
  );

  return courses.map((course, index) => {
    let status: 'completed' | 'available' | 'locked';
    if (completedSet.has(course.id)) {
      status = 'completed';
    } else if (availableSet.has(course.id)) {
      status = 'available';
    } else {
      status = 'locked';
    }

    return {
      id: index + 1,
      name: course.title,
      status,
      courseId: course.id,
    };
  });
}

async function DashboardContent() {
  const user = (await auth())!;

  let courses: Course[] = [];
  let progress: ProgressData | null = null;
  let ranking: RankingUser[] = [];

  try {
    [courses, progress, ranking] = await Promise.all([
      fetchCourses(),
      fetchProgress(),
      fetchGlobalRanking(5),
    ]);
  } catch (e) {
    console.error('Failed to fetch dashboard data:', e);
  }

  const stages = buildStages(courses, progress || { totalLessons: 0, completedLessons: 0, courses: [] });
  const completedLessons = progress?.completedLessons ?? 0;
  const totalLessons = progress?.totalLessons ?? 0;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find the next objective
  const nextCourse = progress?.courses.find((c) => !c.completed);
  const nextObjectiveText = nextCourse
    ? `Completar ${nextCourse.courseTitle}`
    : '¡Todos los cursos completados!';
  const nextProgress = nextCourse
    ? Math.round((nextCourse.completedLessons / nextCourse.totalLessons) * 100)
    : 100;
  const nextXpReward = nextCourse
    ? Math.max(50, (nextCourse.totalLessons - nextCourse.completedLessons) * 50)
    : 0;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Center — Learning Map */}
      <section className="flex-1">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Title row */}
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-super-pandora text-2xl text-gray-900">
                Ruta de aprendizaje
              </h2>
              <p className="font-simply-olive mt-0.5 text-sm text-gray-500">
                Aprendé, practicá y resolvé problemas como en la OIA.
              </p>
            </div>
            <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800">
              <HelpCircle className="h-4 w-4" />
              ¿Cómo funciona?
            </button>
          </div>

          {/* Map */}
          <LearningPath stages={stages} />
        </div>
      </section>

      {/* Right Panel */}
      <aside className="w-full lg:w-80 xl:w-96">
        <div className="space-y-4">
          {/* Progress Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="font-super-pandora mb-3 text-base text-gray-800">
              Progreso General
            </h3>
            <div className="mb-2 flex items-end justify-between">
              <span className="font-candy-beans text-3xl text-pradera-500">
                {progressPct}%
              </span>
              <span className="font-simply-olive text-xs text-gray-400">
                completado
              </span>
            </div>
            <div className="mb-3 h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-pradera-400 to-pradera-500 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="font-simply-olive">
                {completedLessons} de {totalLessons} lecciones
              </span>
              <span className="font-simply-olive">
                {totalLessons - completedLessons} restantes
              </span>
            </div>
          </div>

          {/* Next Objective Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="font-super-pandora mb-3 text-base text-gray-800">
              Próximo Objetivo
            </h3>
            <p className="font-simply-olive mb-2 text-sm text-gray-600">
              {nextObjectiveText}
            </p>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-lagos-400 to-lagos-500"
                style={{ width: `${nextProgress}%` }}
              />
            </div>
            {nextXpReward > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                <span className="font-candy-beans text-sm text-amber-700">
                  +{nextXpReward} XP
                </span>
                <span className="font-simply-olive text-xs text-amber-500">
                  al completar
                </span>
              </div>
            )}
          </div>

          {/* Weekly Ranking */}
          <WeeklyRanking users={ranking} />
        </div>
      </aside>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
