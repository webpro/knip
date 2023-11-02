import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve, join } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/subpath-patterns');

test('Allows subpath-patterns', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'src/internals/unused.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});

test('Allows subpath-patterns (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert(issues.files.has(join(cwd, 'src/internals/unused.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});

test('Allows subpath-patterns (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert(issues.files.has(join(cwd, 'src/internals/unused.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});
