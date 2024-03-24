import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/wrangler');

test('Find dependencies with the wrangler plugin', async () => {
  const { /* issues, */ counters } = await main({
    ...baseArguments,
    cwd,
  });

  // console.log(issues);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });
});
