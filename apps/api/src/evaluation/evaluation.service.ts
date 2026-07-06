import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { config } from '@codi/config';

export interface EvalResult {
  ok: boolean;
  status: string;
  score: number;
  error?: string;
  results?: Array<{ codename: string; outcome: string; passed: boolean }>;
}

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);
  private readonly pythonBin = config.eval.pythonBin;
  private readonly driverPath = path.join(__dirname, '../../src/evaluation/driver.py');

  evaluate(
    language: string,
    sourceCode: string,
    cmsTaskId: number,
  ): Promise<EvalResult> {
    return new Promise((resolve) => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codi_eval_'));
      const sourceFile = path.join(tmpDir, 'source');
      fs.writeFileSync(sourceFile, sourceCode, 'utf-8');

      const child = spawn(
        this.pythonBin,
        [
          this.driverPath,
          '--language', language,
          '--source-file', sourceFile,
          '--task-id', String(cmsTaskId),
        ],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || '' },
          timeout: 120000,
        },
      );

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

      child.on('close', (code) => {
        fs.rmSync(tmpDir, { recursive: true, force: true });

        if (code !== 0) {
          this.logger.error(`Driver exited with code ${code}: ${stderr}`);
          resolve({
            ok: false,
            status: 'RUNTIME_ERROR',
            score: 0,
            error: stderr || `Driver exited with code ${code}`,
          });
          return;
        }

        try {
          const lastLine = stdout.trim().split('\n').pop() || '';
          const result = JSON.parse(lastLine) as EvalResult;
          resolve(result);
        } catch {
          this.logger.error(`Failed to parse driver output: ${stdout}`);
          resolve({
            ok: false,
            status: 'RUNTIME_ERROR',
            score: 0,
            error: 'Failed to parse evaluation result',
          });
        }
      });

      child.on('error', (err) => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        this.logger.error(`Driver spawn error: ${err.message}`);
        resolve({
          ok: false,
          status: 'RUNTIME_ERROR',
          score: 0,
          error: err.message,
        });
      });
    });
  }
}
