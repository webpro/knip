import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/self-reference');

test('Allows self-references', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(Object.keys(issues.unlisted).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('Allows self-references (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert.equal(Object.keys(issues.unlisted).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('Allows self-references (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert.equal(Object.keys(issues.unlisted).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
