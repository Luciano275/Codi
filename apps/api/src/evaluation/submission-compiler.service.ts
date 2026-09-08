import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AsyncSemaphore } from './async-semaphore';
import { evaluationSettings } from './evaluation.constants';
import { IsolateSandboxService, type SandboxExecution } from './isolate-sandbox.service';
import type {
  CmsTaskConfiguration,
  CompiledSubmission,
  EvaluationLanguage,
} from './evaluation.types';

const COMPILE_LIMITS = {
  timeSeconds: 30,
  wallSeconds: 45,
  memoryKb: 524_288,
  outputKb: 102_400,
  processes: 32,
} as const;

export class CompilationError extends Error {}

@Injectable()
export class SubmissionCompilerService {
  private readonly semaphore = new AsyncSemaphore(evaluationSettings.compileConcurrency);
  private readonly graderObjects = new Map<string, Promise<Buffer>>();

  constructor(private readonly sandbox: IsolateSandboxService) {}

  compile(
    language: EvaluationLanguage,
    sourceCode: string,
    task: CmsTaskConfiguration,
  ): Promise<CompiledSubmission> {
    return this.semaphore.use(() =>
      language === 'python'
        ? this.compilePython(sourceCode, task.graderSource)
        : this.compileCpp(sourceCode, task.graderSource),
    );
  }

  private async compilePython(
    sourceCode: string,
    graderSource: string | null,
  ): Promise<CompiledSubmission> {
    const files = new Map<string, Buffer>([['solution.py', Buffer.from(sourceCode)]]);
    if (graderSource) files.set('grader.py', Buffer.from(graderSource));

    await this.sandbox.use(files, async (session) => {
      const filenames = graderSource ? ['solution.py', 'grader.py'] : ['solution.py'];
      const result = await session.execute({
        command: ['/usr/bin/python3', '-m', 'py_compile', ...filenames],
        limits: COMPILE_LIMITS,
      });
      this.assertCompiled(result);
    });

    return {
      files,
      command: graderSource
        ? ['/usr/bin/python3', 'grader.py']
        : ['/usr/bin/python3', 'solution.py'],
    };
  }

  private async compileCpp(
    sourceCode: string,
    graderSource: string | null,
  ): Promise<CompiledSubmission> {
    const graderObject = graderSource ? await this.getGraderObject(graderSource) : null;
    const files = new Map<string, Buffer>([['solution.cpp', Buffer.from(sourceCode)]]);
    if (graderObject) files.set('grader.o', graderObject);

    const executable = await this.sandbox.use(files, async (session) => {
      const compile = await session.execute({
        command: [
          '/usr/bin/g++',
          '-DEVAL',
          '-std=gnu++20',
          '-O2',
          '-pipe',
          '-c',
          '-o',
          'solution.o',
          'solution.cpp',
        ],
        limits: COMPILE_LIMITS,
      });
      this.assertCompiled(compile);

      const objects = graderObject ? ['grader.o', 'solution.o'] : ['solution.o'];
      const link = await session.execute({
        command: [
          '/usr/bin/g++',
          '-B/usr/bin',
          '-static',
          '-s',
          '-o',
          'submission',
          ...objects,
          '-lm',
        ],
        limits: COMPILE_LIMITS,
      });
      this.assertCompiled(link);
      return session.read('submission');
    });

    return {
      files: new Map([['submission', executable]]),
      command: ['./submission'],
    };
  }

  private getGraderObject(graderSource: string): Promise<Buffer> {
    const digest = createHash('sha256').update(graderSource).digest('hex');
    const cached = this.graderObjects.get(digest);
    if (cached) return cached;

    const compilation = this.compileGrader(graderSource).catch((error) => {
      this.graderObjects.delete(digest);
      throw error;
    });
    this.graderObjects.set(digest, compilation);
    return compilation;
  }

  private compileGrader(graderSource: string): Promise<Buffer> {
    const files = new Map([['grader.cpp', Buffer.from(graderSource)]]);
    return this.sandbox.use(files, async (session) => {
      const result = await session.execute({
        command: [
          '/usr/bin/g++',
          '-DEVAL',
          '-std=gnu++20',
          '-O2',
          '-pipe',
          '-c',
          '-o',
          'grader.o',
          'grader.cpp',
        ],
        limits: COMPILE_LIMITS,
      });
      this.assertCompiled(result);
      return session.read('grader.o');
    });
  }

  private assertCompiled(result: SandboxExecution): void {
    if (!result.timedOut && result.exitCode === 0 && !result.metadata.has('status')) return;
    const diagnostic = result.stderr || result.metadata.get('message') || 'Compilation failed';
    throw new CompilationError(diagnostic.trim());
  }
}
