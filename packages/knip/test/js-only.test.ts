import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve, join } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Find unused files and exports with only JS files', async () => {
  const cwd = resolve('fixtures/js-only');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.files.size, 1);
  assert(issues.files.has(join(cwd, 'dangling.js')));

  assert.equal(Object.values(issues.exports).length, 0);

  assert.equal(Object.values(issues.nsExports['my-namespace.js']).length, 2);
  assert.equal(issues.nsExports['my-namespace.js']['x'].symbol, 'x');
  assert.equal(issues.nsExports['my-namespace.js']['z'].symbol, 'z');

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    nsExports: 2,
    processed: 3,
    total: 3,
  });
});
