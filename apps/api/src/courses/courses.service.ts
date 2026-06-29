import { Injectable } from '@nestjs/common';
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

    const acceptedSubmissions = await this.prisma.submission.findMany({
      where: {
        userId,
        status: 'ACCEPTED',
      },
      select: { problemId: true },
    });

    const acceptedProblemIds = new Set(acceptedSubmissions.map((s) => s.problemId));

    const courseProgress = courses.map((course) => {
      const totalCourseLessons = course.modules.reduce(
        (s, m) => s + m.lessons.length,
        0,
      );

      const completedLessons = course.modules.reduce((s, m) => {
        return (
          s +
          m.lessons.filter((l) =>
            l.problems.some((p) => acceptedProblemIds.has(p.id)),
          ).length
        );
      }, 0);

      return {
        courseId: course.id,
        courseTitle: course.title,
        completedLessons,
        totalLessons: totalCourseLessons,
        completed: completedLessons === totalCourseLessons && totalCourseLessons > 0,
      };
    });

    const completedOverall = courseProgress.reduce((s, c) => s + c.completedLessons, 0);

    return {
      totalLessons,
      completedLessons: completedOverall,
      courses: courseProgress,
    };
  }
}
