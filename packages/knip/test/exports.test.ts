import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/exports');

test('Find unused exports', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(Object.values(issues.exports).length, 5);
  assert.equal(issues.exports['default.ts']['NamedExport'].symbol, 'NamedExport');
  assert.equal(issues.exports['my-module.ts']['default'].symbol, 'default');
  assert.equal(issues.exports['my-module.ts']['unusedNumber'].symbol, 'unusedNumber');
  assert.equal(issues.exports['my-module.ts']['unusedFunction'].symbol, 'unusedFunction');
  assert.equal(issues.exports['my-mix.ts']['unusedInMix'].symbol, 'unusedInMix');
  assert.equal(issues.exports['named-exports.ts']['renamedExport'].symbol, 'renamedExport');
  assert.equal(issues.exports['named-exports.ts']['namedExport'].symbol, 'namedExport');
  assert.equal(issues.exports['dynamic-import.ts']['unusedZero'].symbol, 'unusedZero');
  assert(!issues.exports['index.ts']);

  assert.equal(Object.values(issues.types).length, 2);
  assert.equal(issues.types['my-module.ts']['MyAnyType'].symbolType, 'type');
  assert.equal(issues.types['types.ts']['MyEnum'].symbolType, 'enum');
  assert.equal(issues.types['types.ts']['MyType'].symbolType, 'type');
  assert(!issues.types['index.ts']);

  assert.equal(Object.values(issues.nsExports).length, 1);
  assert.equal(issues.nsExports['my-namespace.ts']['nsUnusedKey'].symbol, 'nsUnusedKey');

  assert.equal(Object.values(issues.nsTypes).length, 1);
  assert.equal(issues.nsTypes['my-namespace.ts']['MyNamespace'].symbol, 'MyNamespace');

  assert.equal(Object.values(issues.duplicates).length, 1);
  assert.equal(issues.duplicates['my-module.ts']['exportedResult|default'].symbols?.[0], 'exportedResult');

  assert.equal(issues.exports['default.ts']['NamedExport'].line, 1);
  assert.equal(issues.exports['default.ts']['NamedExport'].col, 14);
  // assert.equal(issues.exports['default.ts']['NamedExport'].pos, 13);

  assert.equal(issues.types['my-module.ts']['MyAnyType'].line, 19);
  assert.equal(issues.types['my-module.ts']['MyAnyType'].col, 13);
  // assert.equal(issues.types['my-module.ts']['MyAnyType'].pos, 702);

  assert.equal(issues.nsExports['my-namespace.ts']['nsUnusedKey'].line, 3);
  assert.equal(issues.nsExports['my-namespace.ts']['nsUnusedKey'].col, 14);
  // assert.equal(issues.nsExports['my-namespace.ts']['nsUnusedKey'].pos, 84);

  assert.equal(issues.nsTypes['my-namespace.ts']['MyNamespace'].line, 5);
  assert.equal(issues.nsTypes['my-namespace.ts']['MyNamespace'].col, 18);
  // assert.equal(issues.nsTypes['my-namespace.ts']['MyNamespace'].pos, 119);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 8,
    nsExports: 1,
    types: 3,
    nsTypes: 1,
    duplicates: 1,
    processed: 17,
    total: 17,
  });
});
