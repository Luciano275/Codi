import assert from 'node:assert/strict';
import test from 'node:test';
import { whiteDiff } from './white-diff';

test('white diff ignores horizontal whitespace and trailing blank lines', async () => {
  assert.equal(await whiteDiff(Buffer.from('1\t  2\n\n'), Buffer.from('1 2')), true);
});

test('white diff preserves line boundaries', async () => {
  assert.equal(await whiteDiff(Buffer.from('1\n2'), Buffer.from('1 2')), false);
});
