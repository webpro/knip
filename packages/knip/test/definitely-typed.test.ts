import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/definitely-typed');

test('Find unused DT @types', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@types/unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    processed: 1,
    total: 1,
  });
});

test('Find type imports in production dependencies (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    isProduction: true,
    isStrict: true,
    cwd,
  });

  assert(issues.dependencies['package.json']['incorrect-production-types']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 1,
    total: 1,
  });
});
