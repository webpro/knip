import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/postcss-next');

test('Find dependencies in PostCSS configuration (implicit w/ Next.js)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['package.json']['autoprefixer']);
  assert(issues.unlisted['postcss.config.json']['autoprefixer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 2,
  });
});
