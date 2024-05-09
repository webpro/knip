import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/re-exports-keyed-ns');

test('Find exports through keyed namespace', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['2-second.ts']['second']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 5,
    total: 5,
  });
});
