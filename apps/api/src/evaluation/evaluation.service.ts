import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { AsyncSemaphore } from './async-semaphore';
import { CmsTaskConfigRepository } from './cms-task-config.repository';
import { evaluationSettings } from './evaluation.constants';
import { IsolateSandboxService, type SandboxExecution } from './isolate-sandbox.service';
import { calculateScore } from './score-calculator';
import { CompilationError, SubmissionCompilerService } from './submission-compiler.service';
import type {
  CmsTaskConfiguration,
  CmsTestcase,
  CompiledSubmission,
  EvaluationCaseResult,
  EvaluationLanguage,
  EvaluationResult,
  EvaluationStatus,
} from './evaluation.types';
import { whiteDiff } from './white-diff';

@Injectable()
export class EvaluationService {
  private readonly testcaseSlots = new AsyncSemaphore(evaluationSettings.testcaseConcurrency);

  constructor(
    private readonly tasks: CmsTaskConfigRepository,
    private readonly compiler: SubmissionCompilerService,
    private readonly sandbox: IsolateSandboxService,
  ) {}

  async evaluate(
    language: EvaluationLanguage,
    sourceCode: string,
    cmsTaskId: number,
  ): Promise<EvaluationResult> {
    try {
      const task = await this.tasks.find(cmsTaskId, language);
      const compiled = await this.compiler.compile(language, sourceCode, task);
      const results = await Promise.all(
        task.testcases.map((testcase) =>
          this.testcaseSlots.use(() => this.evaluateTestcase(compiled, testcase, task)),
        ),
      );
      const score = calculateScore(
        task.scoreType,
        task.scoreTypeParameters,
        task.testcases,
        results,
      );
      return { ok: true, status: this.resolveStatus(results), score, results };
    } catch (error) {
      if (error instanceof CompilationError) {
        return {
          ok: false,
          status: 'COMPILATION_ERROR',
          score: 0,
          error: error.message,
        };
      }
      throw error;
    }
  }

  private evaluateTestcase(
    compiled: CompiledSubmission,
    testcase: CmsTestcase,
    task: CmsTaskConfiguration,
  ): Promise<EvaluationCaseResult> {
    const files = new Map(compiled.files);
    files.set('input.txt', testcase.input);

    return this.sandbox.use(files, async (session) => {
      const execution = await session.execute({
        command: compiled.command,
        limits: {
          timeSeconds: task.timeLimit,
          wallSeconds: task.timeLimit * 2 + 1,
          memoryKb: task.memoryLimitKb,
          outputKb: evaluationSettings.maxOutputKb,
          processes: 5,
        },
        stdin: 'input.txt',
        stdout: 'output.txt',
        stderr: 'stderr.txt',
      });
      return this.toCaseResult(testcase, execution, join(session.boxRoot, 'output.txt'));
    });
  }

  private async toCaseResult(
    testcase: CmsTestcase,
    execution: SandboxExecution,
    outputPath: string,
  ): Promise<EvaluationCaseResult> {
    const metrics = {
      executionTime: this.readNumber(execution.metadata, 'time-wall'),
      memoryKb: this.readNumber(execution.metadata, 'cg-mem'),
    };
    const sandboxStatus = execution.metadata.get('status') ?? '';

    if (execution.timedOut || sandboxStatus.includes('TO')) {
      return this.failedCase(testcase.codename, 'time-limit', 'Límite de tiempo excedido', metrics);
    }
    if (execution.metadata.get('cg-oom-killed') === '1') {
      return this.failedCase(
        testcase.codename,
        'memory-limit',
        'Límite de memoria excedido',
        metrics,
      );
    }
    if (sandboxStatus.includes('SG')) {
      const signal = execution.metadata.get('exitsig') ?? '?';
      return this.failedCase(
        testcase.codename,
        'runtime-error',
        `Error de ejecución (señal ${signal})`,
        metrics,
      );
    }
    if (sandboxStatus.includes('RE') || execution.exitCode !== 0) {
      return this.failedCase(
        testcase.codename,
        'runtime-error',
        'Error de ejecución (código de retorno no cero)',
        metrics,
      );
    }
    if (sandboxStatus.includes('XX')) {
      throw new Error(execution.metadata.get('message') ?? 'Internal isolate failure');
    }

    const passed = await whiteDiff(outputPath, testcase.output);
    return {
      codename: testcase.codename,
      outcome: passed ? 'correct' : 'wrong',
      passed,
      ...metrics,
    };
  }

  private failedCase(
    codename: string,
    outcome: 'runtime-error' | 'time-limit' | 'memory-limit',
    reason: string,
    metrics: Pick<EvaluationCaseResult, 'executionTime' | 'memoryKb'>,
  ): EvaluationCaseResult {
    return { codename, outcome, passed: false, reason, ...metrics };
  }

  private resolveStatus(results: EvaluationCaseResult[]): EvaluationStatus {
    if (results.some((result) => result.outcome === 'time-limit')) return 'TIME_LIMIT_EXCEEDED';
    if (results.some((result) => result.outcome === 'memory-limit')) return 'MEMORY_LIMIT_EXCEEDED';
    if (results.some((result) => result.outcome === 'runtime-error')) return 'RUNTIME_ERROR';
    if (results.every((result) => result.passed)) return 'ACCEPTED';
    return 'WRONG_ANSWER';
  }

  private readNumber(metadata: ReadonlyMap<string, string>, key: string): number | undefined {
    const parsed = Number(metadata.get(key));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}

export type { EvaluationResult } from './evaluation.types';
