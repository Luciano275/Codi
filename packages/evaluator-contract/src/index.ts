import { z } from 'zod';

const MAX_ENCODED_FILE_LENGTH = 6 * 1024 * 1024;
export const MAX_SANDBOX_TIME_SECONDS = 60;
export const MAX_SANDBOX_WALL_SECONDS = 120;
export const MAX_SANDBOX_MEMORY_KB = 512 * 1024;

export const sandboxFilenameSchema = z.enum([
  'grader.cpp',
  'grader.o',
  'grader.py',
  'input.txt',
  'a.out',
  'output.txt',
  'solution.cpp',
  'solution.o',
  'solution.py',
  'source.cpp',
  'source.py',
  'stderr.txt',
  'submission',
]);

export const sandboxLimitsSchema = z
  .object({
    timeSeconds: z.number().positive().max(MAX_SANDBOX_TIME_SECONDS),
    wallSeconds: z.number().positive().max(MAX_SANDBOX_WALL_SECONDS),
    memoryKb: z.number().int().min(1).max(MAX_SANDBOX_MEMORY_KB),
    outputKb: z.number().int().positive().max(102_400),
    processes: z.number().int().positive().max(64),
  })
  .strict();

export const sandboxCommandSchema = z
  .object({
    command: z.array(z.string().min(1).max(256)).min(1).max(20),
    limits: sandboxLimitsSchema,
    stdin: sandboxFilenameSchema.optional(),
    stdout: sandboxFilenameSchema.optional(),
    stderr: sandboxFilenameSchema.optional(),
  })
  .strict();

const sandboxFileInputSchema = z
  .object({
    name: sandboxFilenameSchema,
    content: z.string().max(MAX_ENCODED_FILE_LENGTH),
  })
  .strict();

export const createSandboxSessionSchema = z
  .object({
    files: z.array(sandboxFileInputSchema).min(1).max(4),
  })
  .strict();

export const runSandboxCommandSchema = z
  .object({
    files: z.array(sandboxFileInputSchema).min(1).max(4),
    command: z.array(z.string().min(1).max(256)).min(1).max(20),
    limits: sandboxLimitsSchema,
    stdin: sandboxFilenameSchema.optional(),
    stdout: sandboxFilenameSchema.optional(),
    stderr: sandboxFilenameSchema.optional(),
  })
  .strict();

export const sandboxSessionSchema = z
  .object({
    sessionId: z.uuid(),
  })
  .strict();

export const sandboxExecutionSchema = z
  .object({
    exitCode: z.number().int(),
    signal: z.number().int().nullable(),
    stdout: z.string(),
    stderr: z.string(),
    timedOut: z.boolean(),
    metadata: z.record(z.string(), z.string()),
  })
  .strict();

export const runSandboxResponseSchema = sandboxExecutionSchema
  .extend({
    box: z.string().min(1).max(256),
    stdoutFile: z.string().max(MAX_ENCODED_FILE_LENGTH).optional(),
    stderrFile: z.string().max(MAX_ENCODED_FILE_LENGTH).optional(),
  })
  .strict();

export const sandboxFileSchema = z
  .object({
    content: z.string().max(MAX_ENCODED_FILE_LENGTH),
  })
  .strict();

export const createSandboxTerminalSchema = z
  .object({
    command: z.array(z.string().min(1).max(256)).min(1).max(20),
    limits: sandboxLimitsSchema,
  })
  .strict();

export const sandboxTerminalSchema = z
  .object({
    terminalId: z.string().min(1).max(128),
  })
  .strict();

export const sandboxTerminalInputSchema = z
  .object({
    data: z.string().max(10_000),
  })
  .strict();

export const sandboxTerminalEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('data'), content: z.string() }).strict(),
  z
    .object({
      type: z.literal('exit'),
      code: z.number().int(),
      signal: z.number().int().nullable(),
      timedOut: z.boolean(),
    })
    .strict(),
  z.object({ type: z.literal('error'), message: z.string() }).strict(),
  z.object({ type: z.literal('truncated') }).strict(),
]);

export type SandboxFilename = z.infer<typeof sandboxFilenameSchema>;
export type SandboxLimits = z.infer<typeof sandboxLimitsSchema>;
export type SandboxCommand = z.infer<typeof sandboxCommandSchema>;
export type CreateSandboxSession = z.infer<typeof createSandboxSessionSchema>;
export type SandboxExecutionResponse = z.infer<typeof sandboxExecutionSchema>;
export type RunSandboxCommand = z.infer<typeof runSandboxCommandSchema>;
export type RunSandboxResponse = z.infer<typeof runSandboxResponseSchema>;
export type CreateSandboxTerminal = z.infer<typeof createSandboxTerminalSchema>;
export type SandboxTerminalEvent = z.infer<typeof sandboxTerminalEventSchema>;
