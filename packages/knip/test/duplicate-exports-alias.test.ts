import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/duplicate-exports-alias');

test('Ignore duplicate exports with @alias (JSDoc)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.duplicates['helpers.ts']['isUntagged|isUntaggedAlias']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    duplicates: 1,
    processed: 2,
    total: 2,
  });
});
