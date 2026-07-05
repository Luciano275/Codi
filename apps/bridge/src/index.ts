import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';

// Buscar .env subiendo desde CWD hasta /
function findEnv(start: string): string | null {
  let dir = resolve(start);
  for (;;) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
const envFile = findEnv(process.cwd());
if (envFile) dotenv.config({ path: envFile });

import pg from 'pg';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const { Pool } = pg;

// ─── Config ───────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/cmsdb';
const CMS_API_URL = process.env.CMS_API_URL || 'http://localhost:8888';
const CMS_ADMIN_TOKEN = process.env.CMS_ADMIN_TOKEN || '';
const CMS_CONTEST_NAME = process.env.CMS_CONTEST_NAME || 'simulacro';
const POLL_INTERVAL_MS = parseInt(process.env.BRIDGE_POLL_INTERVAL || '500', 10);

// ─── DB Pool ──────────────────────────────────────────────
const pool = new Pool({ connectionString: DATABASE_URL });

// ─── Helpers ──────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extensionForLanguage(language: string): string {
  const map: Record<string, string> = {
    python: 'py',
    cpp: 'cpp',
    c: 'c',
    java: 'java',
    pascal: 'pas',
  };
  return map[language] || language;
}

async function submitToCms(
  submissionRequestId: string,
  submissionId: string,
  code: string,
  language: string,
  username: string,
  cmsTaskName: string,
): Promise<{ ok: boolean; cmsSubmissionId?: number; error?: string }> {
  const tmpFile = path.join(os.tmpdir(), `bridge_${submissionId}.${extensionForLanguage(language)}`);
  try {
    fs.writeFileSync(tmpFile, code, 'utf-8');

    const form = new FormData();
    const filename = `source.${extensionForLanguage(language)}`;
    form.append(filename, fs.createReadStream(tmpFile), filename);
    form.append('admin_token', CMS_ADMIN_TOKEN);
    form.append('username', username);
    form.append('language', language);

    const url = `${CMS_API_URL}/${CMS_CONTEST_NAME}/api/admin-submit/${cmsTaskName}`;
    const res = await fetch(url, {
      method: 'POST',
      body: form as any,
      headers: (form as any).getHeaders?.(),
      // @ts-ignore - undici/fetch timeout
      signal: AbortSignal.timeout?.(30000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'unknown');
      return { ok: false, error: `CMS HTTP ${res.status}: ${text}` };
    }

    const data = await res.json() as { submission_id?: number };
    if (!data.submission_id) {
      return { ok: false, error: 'CMS response missing submission_id' };
    }

    return { ok: true, cmsSubmissionId: data.submission_id };
  } catch (err: any) {
    return { ok: false, error: err.message };
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

// ─── Main Loop ────────────────────────────────────────────
async function main() {
  console.log('[Bridge] Starting CMS Bridge Service');
  console.log(`[Bridge] CMS API: ${CMS_API_URL}`);
  console.log(`[Bridge] Contest: ${CMS_CONTEST_NAME}`);
  console.log(`[Bridge] Poll interval: ${POLL_INTERVAL_MS}ms`);

  // Retry DB connection until available
  for (let attempts = 0; ; attempts++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[Bridge] Database connected');
      break;
    } catch (err) {
      if (attempts === 0) {
        console.log('[Bridge] Waiting for database...');
      }
      await sleep(2000);
    }
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `SELECT
           sr.id AS request_id,
           sr."submissionId",
           sr.status AS request_status,
           s.code,
           s.language,
           u.username,
           p."cmsTaskName"
         FROM codi_submission_request sr
         JOIN codi_submission s ON s.id = sr."submissionId"
         JOIN codi_user u ON u.id = s."userId"
         JOIN codi_problem p ON p.id = s."problemId"
         WHERE sr.status = 'pending'
         LIMIT 5
         FOR UPDATE OF sr SKIP LOCKED`,
      );

      if (result.rows.length > 0) {
        console.log(`[Bridge] Processing ${result.rows.length} pending requests`);
      }

      for (const row of result.rows) {
        console.log(`[Bridge] Submitting request ${row.request_id} (submission ${row.submissionId})`);

        const submissionResult = await submitToCms(
          row.request_id,
          row.submissionId,
          row.code,
          row.language,
          row.username,
          row.cmsTaskName,
        );

        if (submissionResult.ok) {
          await client.query(
            `UPDATE codi_submission_request
             SET status = 'submitted', "cmsSubmissionId" = $1, "processedAt" = NOW()
             WHERE id = $2`,
            [submissionResult.cmsSubmissionId, row.request_id],
          );
          console.log(
            `[Bridge] Submitted request ${row.request_id} -> CMS submission ${submissionResult.cmsSubmissionId}`,
          );
        } else {
          await client.query(
            `UPDATE codi_submission_request
             SET status = 'failed', "errorMessage" = $1, "processedAt" = NOW()
             WHERE id = $2`,
            [submissionResult.error, row.request_id],
          );
          console.error(`[Bridge] Failed request ${row.request_id}: ${submissionResult.error}`);
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[Bridge] Transaction error:', err);
    } finally {
      client.release();
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch((err) => {
  console.error('[Bridge] Fatal error:', err);
  process.exit(1);
});
