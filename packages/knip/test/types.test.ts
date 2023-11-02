import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/types');

test('Find @types/pkg that are obsolete, since pkg has types included', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@types/webpack']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});
