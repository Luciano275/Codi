import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateScore } from './score-calculator';
import type { CmsTestcase, EvaluationCaseResult } from './evaluation.types';

const testcases = ['000', '001', '002', '003'].map(
  (codename): CmsTestcase => ({ codename, input: Buffer.alloc(0), output: Buffer.alloc(0) }),
);

test('GroupMin gives a group no points when one testcase fails', () => {
  const results = createResults([true, false, true, true]);
  assert.equal(
    calculateScore(
      'GroupMin',
      [
        [25, 2],
        [75, 2],
      ],
      testcases,
      results,
    ),
    75,
  );
});

test('GroupMin supports CMS regular-expression selectors', () => {
  const results = createResults([true, true, false, true]);
  const parameters = [
    [40, '^00[01]$'],
    [60, '^00[23]$'],
  ];
  assert.equal(calculateScore('GroupMin', parameters, testcases, results), 40);
});

function createResults(passed: boolean[]): EvaluationCaseResult[] {
  return testcases.map((testcase, index) => ({
    codename: testcase.codename,
    outcome: passed[index] ? 'correct' : 'wrong',
    passed: passed[index],
  }));
}
