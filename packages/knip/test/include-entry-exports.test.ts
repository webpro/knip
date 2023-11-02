import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/include-entry-exports');

test('Skip unused exports in entry source files', async () => {
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

test('Report unused exports in entry source files', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert(issues.exports['cli.js']['a']);
  assert(issues.exports['index.ts']['default']);
  assert(issues.exports['main.ts']['x']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    types: 3,
    processed: 4,
    total: 4,
  });
});
