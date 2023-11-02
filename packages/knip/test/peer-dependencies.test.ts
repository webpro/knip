import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/peer-dependencies');

test('Find unused dependencies', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 1,
    total: 1,
  });
});
