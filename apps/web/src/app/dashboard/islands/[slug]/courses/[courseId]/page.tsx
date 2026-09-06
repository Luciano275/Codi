import { notFound } from 'next/navigation';
import LearningPath, { type LearningPathStep } from '@/components/islands/LearningPath';
import { fetchCoursePath, fetchProgress } from '@/lib/server-api';

export default async function CourseSubmodulePathPage({
  params,
}: {
  params: Promise<{ slug: string; courseId: string }>;
}) {
  const { slug, courseId } = await params;
  const [course, progress] = await Promise.all([fetchCoursePath(courseId), fetchProgress()]);
  if (course.island?.slug !== slug) notFound();

  const completedLessonIds = new Set(progress.completedLessonIds);
  const lessons = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, module })),
  );
  const currentLessonId = lessons.find((lesson) => !completedLessonIds.has(lesson.id))?.id;
  const steps: LearningPathStep[] = course.modules.flatMap((module) => {
    const completed =
      module.lessons.length > 0 && module.lessons.every((lesson) => completedLessonIds.has(lesson.id));
    const current = module.lessons.some((lesson) => lesson.id === currentLessonId);
    const locked = !completed && !current;
    const submoduleStep: LearningPathStep = {
      id: `submodule-${module.id}`,
      title: module.title,
      eyebrow: `Submódulo ${module.order}`,
      detail: `${module.lessons.length} lecciones`,
      completed,
      current,
      locked,
      kind: 'submodule',
    };
    const lessonSteps = module.lessons.map((lesson) => {
      const lessonCompleted = completedLessonIds.has(lesson.id);
      const lessonCurrent = lesson.id === currentLessonId;
      return {
        id: lesson.id,
        title: lesson.title,
        eyebrow: `Lección ${lesson.order} · ${lesson.type}`,
        detail: `${lesson.xpReward} XP`,
        href: `/dashboard/lessons/${lesson.id}`,
        completed: lessonCompleted,
        current: lessonCurrent,
        locked: !lessonCompleted && !lessonCurrent,
        kind: 'lesson' as const,
      };
    });
    return [submoduleStep, ...lessonSteps];
  });

  return (
    <LearningPath
      backHref={`/dashboard/islands/${slug}`}
      backLabel="Volver a los módulos"
      description="Recorré los submódulos y completá sus lecciones para avanzar."
      eyebrow="Ruta de submódulos y lecciones"
      itemLabel="hitos"
      steps={steps}
      title={course.title}
      variant="submodules"
    />
  );
}
