import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/include-entry-reexports');

test('Skip unused nsExports in entry source files', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: false,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});

test('Report unused nsExports in entry source files', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert(issues.nsExports['packages/shared/bar.mjs']['bar']);

  assert.deepEqual(counters, {
    ...baseCounters,
    nsExports: 1,
    processed: 4,
    total: 4,
  });
});
