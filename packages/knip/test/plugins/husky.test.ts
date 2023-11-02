import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import * as husky from '../../src/plugins/husky/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/husky');
const manifest = getManifest(cwd);

test('Find dependencies in husky configuration (plugin)', async () => {
  const configFilePath = join(cwd, '.husky/pre-commit');
  const dependencies = await husky.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['lint-staged', 'bin:commitlint']);
});

test('Find dependencies in husky configuration (main)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['.husky/pre-push']['jest']);
  assert(issues.binaries['.husky/pre-push']['pretty-quick']);
  assert(issues.binaries['.husky/pre-rebase']['eslint']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 3,
    processed: 0,
    total: 0,
  });
});
