import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@codi/database';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      orderBy: { order: 'asc' },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                problems: {
                  select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                problems: {
                  select: { id: true, cmsTaskId: true, title: true, difficulty: true, xpReward: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async getProgress(userId: string) {
    const courses = await this.prisma.course.findMany({
      orderBy: { order: 'asc' },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                problems: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    const totalLessons = courses.reduce(
      (sum, c) => sum + c.modules.reduce((s, m) => s + m.lessons.length, 0),
      0,
    );

    const completedLessons = await this.prisma.lessonCompletion.findMany({
      where: { userId },
      select: { lessonId: true },
    });

    const completedLessonIds = new Set(completedLessons.map((c) => c.lessonId));

    const isLessonCompleted = (lesson: { id: string }) =>
      completedLessonIds.has(lesson.id);

    const courseProgress = courses.map((course) => {
      const totalCourseLessons = course.modules.reduce(
        (s, m) => s + m.lessons.length,
        0,
      );

      const completed = course.modules.reduce(
        (s, m) => s + m.lessons.filter(isLessonCompleted).length,
        0,
      );

      return {
        courseId: course.id,
        courseTitle: course.title,
        completedLessons: completed,
        totalLessons: totalCourseLessons,
        completed: completed === totalCourseLessons && totalCourseLessons > 0,
      };
    });

    const completedOverall = courseProgress.reduce((s, c) => s + c.completedLessons, 0);

    return {
      totalLessons,
      completedLessons: completedOverall,
      courses: courseProgress,
    };
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, xpReward: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const existing = await this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (existing) throw new ConflictException('Lesson already completed');

    // Validate all exercises have score >= 60
    const problems = await this.prisma.problem.findMany({
      where: { lessonId },
      select: { id: true },
    });
    if (problems.length > 0) {
      const problemIds = problems.map((p) => p.id);
      const bestScores = await this.prisma.submission.groupBy({
        by: ['problemId'],
        where: {
          userId,
          problemId: { in: problemIds },
          status: 'ACCEPTED',
          score: { gte: 60 },
        },
        _max: { score: true },
      });
      const qualifiedProblemIds = new Set(bestScores.map((s) => s.problemId));
      const missing = problemIds.filter((id) => !qualifiedProblemIds.has(id));
      if (missing.length > 0) {
        throw new ForbiddenException(
          `Debés resolver todos los ejercicios con al menos 60 puntos antes de completar la lección. Faltan ${missing.length} ejercicio(s).`,
        );
      }
    }

    const [completion] = await this.prisma.$transaction([
      this.prisma.lessonCompletion.create({
        data: { userId, lessonId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: lesson.xpReward } },
      }),
    ]);

    return { completed: true, xpAwarded: lesson.xpReward };
  }

  async uncompleteLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, xpReward: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const existing = await this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (!existing) throw new NotFoundException('Lesson not completed');

    await this.prisma.$transaction([
      this.prisma.lessonCompletion.delete({
        where: { userId_lessonId: { userId, lessonId } },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { xp: { decrement: lesson.xpReward } },
      }),
    ]);

    return { completed: false, xpRefunded: lesson.xpReward };
  }

  async getLessonStatus(userId: string, lessonId: string) {
    const completion = await this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    return { completed: !!completion, completedAt: completion?.completedAt ?? null };
  }
}
