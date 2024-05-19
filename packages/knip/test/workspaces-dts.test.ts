import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-dts');

test('Find unused un-built exports across workspaces', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['packages/shared/src/index.js']['unusedFunction']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 9,
    total: 9,
  });
});
