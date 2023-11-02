import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/jsdoc-exports');

test('Find exports from jsdoc @type tags', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['module.js']['alphaFn']);
  assert(issues.exports['module.js']['internalUnusedFn']);
  assert(issues.exports['module.js']['invalidTaggedFn']);
  assert(issues.exports['module.js']['unusedFn']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    processed: 3,
    total: 3,
  });
});

test('Find exports from jsdoc @type tags (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert(issues.exports['module.js']['alphaFn']);
  assert(issues.exports['module.js']['internalFn']);
  assert(issues.exports['module.js']['internalUnusedFn']);
  assert(issues.exports['module.js']['invalidTaggedFn']);
  assert(issues.exports['module.js']['unusedFn']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 5,
    processed: 2,
    total: 2,
  });
});
