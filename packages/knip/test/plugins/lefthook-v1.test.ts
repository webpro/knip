import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/lefthook-v1');

test('Find dependencies in lefthook v1 configuration', async () => {
  const CI = process.env.CI;
  process.env.CI = '';
  await fs.rename(join(cwd, '_git'), join(cwd, '.git')); // Can't add .git folder to repo

  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });

  process.env.CI = CI;
  await fs.rename(join(cwd, '.git'), join(cwd, '_git'));
});
