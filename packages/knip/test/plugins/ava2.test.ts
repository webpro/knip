import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/ava2');

test('Find dependencies in ava configuration (2)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, '__tests__/__helpers__/index.cjs')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 6,
    total: 6,
  });
});
