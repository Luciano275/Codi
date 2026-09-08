import type { CmsTestcase, EvaluationCaseResult } from './evaluation.types';

type GroupParameter = [number, number | string];

export function calculateScore(
  scoreType: string,
  parameters: unknown,
  testcases: CmsTestcase[],
  results: EvaluationCaseResult[],
): number {
  const outcomes = new Map(results.map((result) => [result.codename, result.passed ? 1 : 0]));
  if (scoreType === 'GroupMin') {
    return calculateGroupMin(parameters, testcases, outcomes);
  }
  if (scoreType === 'Sum') {
    const multiplier = requireNumber(parameters, 'Sum score multiplier');
    return testcases.reduce(
      (score, testcase) => score + (outcomes.get(testcase.codename) ?? 0) * multiplier,
      0,
    );
  }
  throw new Error(`Unsupported score type ${scoreType}`);
}

function calculateGroupMin(
  parameters: unknown,
  testcases: CmsTestcase[],
  outcomes: ReadonlyMap<string, number>,
): number {
  const groups = requireGroups(parameters);
  const codenames = testcases.map((testcase) => testcase.codename).sort();
  let cursor = 0;

  return groups.reduce((score, [weight, selector]) => {
    const targets =
      typeof selector === 'number'
        ? codenames.slice(cursor, (cursor += selector))
        : codenames.filter((codename) => new RegExp(selector).test(codename));
    if (targets.length === 0) throw new Error(`GroupMin selector ${selector} matches no testcase`);
    const minimum = Math.min(...targets.map((codename) => outcomes.get(codename) ?? 0));
    return score + minimum * weight;
  }, 0);
}

function requireGroups(parameters: unknown): GroupParameter[] {
  if (!Array.isArray(parameters)) throw new Error('Invalid GroupMin parameters');
  return parameters.map((parameter) => {
    if (!Array.isArray(parameter) || parameter.length !== 2) {
      throw new Error('Invalid GroupMin group');
    }
    const weight = requireNumber(parameter[0], 'GroupMin weight');
    const selector = parameter[1];
    if (!(typeof selector === 'string' || (Number.isInteger(selector) && Number(selector) >= 0))) {
      throw new Error('Invalid GroupMin selector');
    }
    return [weight, selector] as GroupParameter;
  });
}

function requireNumber(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid ${name}`);
  return value;
}
