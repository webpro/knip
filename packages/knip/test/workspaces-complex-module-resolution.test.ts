import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-complex-module-resolution');

test('Resolve modules properly across multiple workspaces', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
    isDebug: true,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});
