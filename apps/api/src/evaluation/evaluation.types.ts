export type EvaluationLanguage = 'python' | 'cpp';

export type EvaluationStatus =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'COMPILATION_ERROR';

export interface EvaluationCaseResult {
  codename: string;
  outcome: 'correct' | 'wrong' | 'runtime-error' | 'time-limit' | 'memory-limit';
  passed: boolean;
  reason?: string;
  executionTime?: number;
  memoryKb?: number;
}

export interface EvaluationResult {
  ok: boolean;
  status: EvaluationStatus;
  score: number;
  error?: string;
  results?: EvaluationCaseResult[];
}

export interface CmsTestcase {
  codename: string;
  input: Buffer;
  output: Buffer;
}

export interface CmsTaskConfiguration {
  datasetId: number;
  timeLimit: number;
  memoryLimitKb: number;
  taskType: string;
  taskTypeParameters: unknown;
  scoreType: string;
  scoreTypeParameters: unknown;
  graderSource: string | null;
  testcases: CmsTestcase[];
}

export interface CompiledSubmission {
  command: string[];
  files: ReadonlyMap<string, Buffer>;
}
