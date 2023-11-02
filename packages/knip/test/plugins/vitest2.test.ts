import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vitest2');

test('Find dependencies in vitest configuration (entry) 2', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'src/basic.spec.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});
