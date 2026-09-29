import { NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import type { TaskResourceLimits } from './playground-execution-limits';

interface DatasetLimitsRow {
  timeLimit: number | null;
  memoryLimitBytes: bigint | null;
}

@Injectable()
export class PlaygroundTaskLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async find(problemId: string): Promise<TaskResourceLimits | undefined> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { cmsTaskId: true },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const datasets = await this.prisma.$queryRaw<DatasetLimitsRow[]>`
      SELECT
        dataset.time_limit AS "timeLimit",
        dataset.memory_limit AS "memoryLimitBytes"
      FROM public.tasks task
      JOIN public.datasets dataset ON dataset.id = task.active_dataset_id
      WHERE task.id = ${problem.cmsTaskId}
      LIMIT 1
    `;
    return datasets[0];
  }
}
