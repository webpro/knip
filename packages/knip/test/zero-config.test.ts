import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Find unused exports in zero-config mode', async () => {
  const cwd = resolve('fixtures/zero-config');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.files.size, 1);

  assert.equal(Object.values(issues.exports).length, 1);
  assert.equal(issues.exports['my-module.ts']['unused'].symbol, 'unused');
  assert.equal(issues.exports['my-module.ts']['default'].symbol, 'default');
  assert(!issues.exports['index.ts']);

  assert.equal(Object.values(issues.types).length, 1);
  assert.equal(issues.types['my-module.ts']['AnyType'].symbolType, 'type');

  assert.equal(Object.values(issues.nsExports).length, 1);
  assert.equal(issues.nsExports['my-namespace.ts']['z'].symbol, 'z');

  assert.equal(Object.values(issues.nsTypes).length, 1);
  assert.equal(issues.nsTypes['my-namespace.ts']['NS'].symbol, 'NS');

  assert.equal(Object.values(issues.duplicates).length, 1);
  assert.equal(issues.duplicates['my-module.ts']['myExport|default'].symbols?.[0], 'myExport');

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    exports: 2,
    nsExports: 1,
    types: 1,
    nsTypes: 1,
    duplicates: 1,
    processed: 4,
    total: 4,
  });
});
