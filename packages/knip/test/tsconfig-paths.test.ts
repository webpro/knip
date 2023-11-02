import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Resolve modules properly using tsconfig paths and globs', async () => {
  const cwd = resolve('fixtures/tsconfig-paths');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.dependencies['package.json']['internal'].symbol, 'internal');

  assert.equal(issues.unlisted['index.ts']['@unknown'].symbol, '@unknown');
  assert.equal(issues.unlisted['index.ts']['unresolved/dir'].symbol, 'unresolved/dir');

  assert.equal(issues.exports['internal-package/index.ts']['unused'].symbol, 'unused');
  assert.equal(issues.exports['unprefixed/module.ts']['unused'].symbol, 'unused');

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 2,
    exports: 2,
    processed: 6,
    total: 6,
  });
});
