import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { whiteDiff } from './white-diff';

test('white diff ignores horizontal whitespace and trailing blank lines', async () => {
  await withOutput('1\t  2\n\n', async (path) => {
    assert.equal(await whiteDiff(path, Buffer.from('1 2')), true);
  });
});

test('white diff preserves line boundaries', async () => {
  await withOutput('1\n2', async (path) => {
    assert.equal(await whiteDiff(path, Buffer.from('1 2')), false);
  });
});

async function withOutput(content: string, assertion: (path: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'codi-white-diff-'));
  const path = join(directory, 'output.txt');
  try {
    await writeFile(path, content);
    await assertion(path);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
