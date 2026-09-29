import { Injectable } from '@nestjs/common';
import { PrismaService } from '@codi/database';
import { MAX_SANDBOX_MEMORY_KB, MAX_SANDBOX_TIME_SECONDS } from '@codi/evaluator-contract';
import { evaluationSettings } from './evaluation.constants';
import type { CmsTaskConfiguration, CmsTestcase, EvaluationLanguage } from './evaluation.types';

interface DatasetRow {
  id: number;
  timeLimit: number | null;
  memoryLimit: bigint | null;
  taskType: string;
  taskTypeParameters: unknown;
  scoreType: string;
  scoreTypeParameters: unknown;
  grader: Buffer | null;
}

interface TestcaseRow {
  codename: string;
  input: Buffer | null;
  output: Buffer | null;
}

interface CacheEntry {
  expiresAt: number;
  value: CmsTaskConfiguration;
}

@Injectable()
export class CmsTaskConfigRepository {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async find(cmsTaskId: number, language: EvaluationLanguage): Promise<CmsTaskConfiguration> {
    const cacheKey = `${cmsTaskId}:${language}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const configuration = await this.load(cmsTaskId, language);
    this.cache.set(cacheKey, {
      value: configuration,
      expiresAt: Date.now() + evaluationSettings.cacheTtlMs,
    });
    return configuration;
  }

  private async load(
    cmsTaskId: number,
    language: EvaluationLanguage,
  ): Promise<CmsTaskConfiguration> {
    const graderFilename = language === 'python' ? 'grader.py' : 'grader.cpp';
    const datasets = await this.prisma.$queryRaw<DatasetRow[]>`
      SELECT
        d.id,
        d.time_limit AS "timeLimit",
        d.memory_limit AS "memoryLimit",
        d.task_type AS "taskType",
        d.task_type_parameters AS "taskTypeParameters",
        d.score_type AS "scoreType",
        d.score_type_parameters AS "scoreTypeParameters",
        lo_get(grader_object.loid) AS grader
      FROM public.tasks task
      JOIN public.datasets d ON d.id = task.active_dataset_id
      LEFT JOIN public.managers manager
        ON manager.dataset_id = d.id AND manager.filename = ${graderFilename}
      LEFT JOIN public.fsobjects grader_object ON grader_object.digest = manager.digest
      WHERE task.id = ${cmsTaskId}
      LIMIT 1
    `;
    const dataset = datasets[0];
    if (!dataset) throw new Error(`CMS task ${cmsTaskId} has no active dataset`);

    const testcaseRows = await this.prisma.$queryRaw<TestcaseRow[]>`
      SELECT
        testcase.codename,
        lo_get(input_object.loid) AS input,
        lo_get(output_object.loid) AS output
      FROM public.testcases testcase
      LEFT JOIN public.fsobjects input_object ON input_object.digest = testcase.input
      LEFT JOIN public.fsobjects output_object ON output_object.digest = testcase.output
      WHERE testcase.dataset_id = ${dataset.id}
      ORDER BY testcase.codename
    `;

    this.validateDataset(dataset, cmsTaskId);
    if (testcaseRows.length === 0) throw new Error(`CMS task ${cmsTaskId} has no testcases`);
    return {
      datasetId: dataset.id,
      timeLimit: this.normalizeTimeLimit(dataset.timeLimit),
      memoryLimitKb: this.normalizeMemoryLimit(dataset.memoryLimit),
      taskType: dataset.taskType,
      taskTypeParameters: dataset.taskTypeParameters,
      scoreType: dataset.scoreType,
      scoreTypeParameters: dataset.scoreTypeParameters,
      graderSource: dataset.grader ? Buffer.from(dataset.grader).toString('utf8') : null,
      testcases: testcaseRows.map(this.toTestcase),
    };
  }

  private validateDataset(dataset: DatasetRow, cmsTaskId: number): void {
    if (dataset.taskType !== 'Batch') {
      throw new Error(`CMS task ${cmsTaskId} uses unsupported task type ${dataset.taskType}`);
    }
    if (!['GroupMin', 'Sum'].includes(dataset.scoreType)) {
      throw new Error(`CMS task ${cmsTaskId} uses unsupported score type ${dataset.scoreType}`);
    }
    const parameters = dataset.taskTypeParameters;
    if (!Array.isArray(parameters) || parameters.at(-1) !== 'diff') {
      throw new Error(`CMS task ${cmsTaskId} does not use the supported diff comparator`);
    }
  }

  private normalizeTimeLimit(value: number | null): number {
    if (!value || !Number.isFinite(value) || value < 0) return 1;
    return Math.min(Math.ceil(value), MAX_SANDBOX_TIME_SECONDS);
  }

  private normalizeMemoryLimit(value: bigint | null): number {
    if (!value || value <= 0n) return MAX_SANDBOX_MEMORY_KB;
    const memoryKb = Number(value / 1024n);
    if (!Number.isSafeInteger(memoryKb) || memoryKb < 1) return MAX_SANDBOX_MEMORY_KB;
    return Math.min(memoryKb, MAX_SANDBOX_MEMORY_KB);
  }

  private readonly toTestcase = (row: TestcaseRow): CmsTestcase => ({
    codename: row.codename,
    input: row.input ? Buffer.from(row.input) : Buffer.alloc(0),
    output: row.output ? Buffer.from(row.output) : Buffer.alloc(0),
  });
}
