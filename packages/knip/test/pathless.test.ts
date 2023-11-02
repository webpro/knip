import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Resolve local modules without a relative path', async () => {
  const cwd = resolve('fixtures/pathless');

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
