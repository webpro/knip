import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/subpath-import');

test('Allows subpath-imports', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(Object.keys(issues.unlisted).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    files: 1,
    processed: 3,
    total: 3,
  });
});

test('Allows subpath-imports (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert.equal(Object.keys(issues.unlisted).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    files: 1,
    processed: 3,
    total: 3,
  });
});

test('Allows subpath-imports (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert.equal(Object.keys(issues.unlisted).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    files: 1,
    processed: 3,
    total: 3,
  });
});
