import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Find exports from jsdoc @type tags', async () => {
  const cwd = resolve('fixtures/jsdoc');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['index.ts']['some-types']);
  assert(issues.unlisted['index.ts']['@jest/types']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 3,
    processed: 1,
    total: 1,
  });
});
