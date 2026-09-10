import { notFound } from 'next/navigation';
import LearningPath, { type LearningPathStep } from '@/components/islands/LearningPath';
import { fetchIslandPath, fetchProgress } from '@/lib/server-api';

export default async function IslandLearningPathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [island, progress] = await Promise.all([fetchIslandPath(slug), fetchProgress()]);
  if (!island.available) notFound();

  const courseProgress = new Map(progress.courses.map((course) => [course.courseId, course]));
  const steps: LearningPathStep[] = island.courses.map((course, index, courses) => {
    const completed = courseProgress.get(course.id)?.completed ?? false;
    const current = !completed && courses.slice(0, index).every((item) => {
      return courseProgress.get(item.id)?.completed ?? false;
    });

    return {
      id: course.id,
      title: course.title,
      eyebrow: `Módulo ${course.order}`,
      detail: `${course._count.modules} submódulos`,
      href: `/dashboard/islands/${slug}/courses/${course.id}`,
      completed,
      current,
      locked: !completed && !current,
    };
  });

  return (
    <LearningPath
      backHref="/dashboard"
      backLabel="Volver a las islas"
      description={island.description}
      itemLabel="módulos"
      steps={steps}
      title={island.title}
      variant="modules"
    />
  );
}
