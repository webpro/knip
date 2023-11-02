import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-ignored');

test('Ignore workspaces', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(Object.keys(issues.binaries).length, 1);
  assert(issues.binaries['packages/e/package.json']['not-ignored']);

  assert.deepEqual(configurationHints, new Set([{ type: 'ignoreWorkspaces', identifier: 'packages/f' }]));

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
  });
});
