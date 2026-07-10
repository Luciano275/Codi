import { Suspense } from 'react';
import { HelpCircle } from 'lucide-react';
import LearningPath from '@/components/dashboard/LearningPath';
import ProgressCard from '@/components/ui/ProgressCard';
import ObjectiveCard from '@/components/ui/ObjectiveCard';
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
    <div className="flex flex-col gap-4 md:gap-6 lg:flex-row">
      <section className="min-w-0 flex-[1_1_0%]">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-50 px-4 pb-3 pt-3.5 md:px-5 md:pb-4 md:pt-4">
            <div>
              <h2 className="font-super-pandora text-lg text-gray-900 drop-shadow-xs md:text-xl xl:text-2xl">
                Ruta de aprendizaje
              </h2>
              <p className="font-simply-olive mt-0.5 text-xs text-gray-500 md:text-sm">
                Aprendé, practicá y resolvé problemas como en la OIA.
              </p>
            </div>
            <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-xs transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm md:px-4 md:py-2 md:text-sm">
              <HelpCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              ¿Cómo funciona?
            </button>
          </div>

          <div className="p-3 md:p-4">
            <LearningPath stages={stages} />
          </div>
        </div>
      </section>

      <aside className="w-full shrink-0 lg:w-64 xl:w-72 2xl:w-80">
        <div className="space-y-3 md:space-y-4">
          <ProgressCard
            percentage={progressPct}
            completed={completedLessons}
            total={totalLessons}
            remaining={totalLessons - completedLessons}
          />

          <ObjectiveCard
            title={nextObjectiveText}
            progress={nextProgress}
            xpReward={nextXpReward}
          />

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
