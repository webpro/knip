import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/internal');

test('Report internal exports', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Report internal exports (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert(issues.exports['helpers.js']['internalHelper']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 2,
    total: 2,
  });
});

test('Report internal exports (production + ignore-internal)', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isIgnoreInternal: true,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
