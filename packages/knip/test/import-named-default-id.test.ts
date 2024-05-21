import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/import-named-default-id');

test('Find unused exports by correct name', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['utils.ts']['utilOne']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 2,
    total: 2,
  });
});
