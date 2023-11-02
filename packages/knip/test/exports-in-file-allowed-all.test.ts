import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/exports-in-file-allowed-all');

test('Find unused exports respecting an ignoreExportsUsedInFile boolean', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(Object.values(issues.exports).length, 1);
  assert.equal(issues.exports['imported.ts']['referencedNeverFunction'].symbol, 'referencedNeverFunction');

  assert.equal(Object.values(issues.types).length, 1);
  assert.equal(Object.values(issues.types['imported.ts']).length, 1);
  assert.equal(issues.types['imported.ts']['ReferencedNeverInterface'].symbol, 'ReferencedNeverInterface');

  assert.deepEqual(counters, {
    ...baseCounters,
    duplicates: 0,
    exports: 1,
    nsExports: 0,
    nsTypes: 0,
    processed: 2,
    total: 2,
    types: 1,
  });
});
