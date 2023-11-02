import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-nested');

const expectedConfigurationHints = new Set([
  { type: 'ignoreDependencies', workspaceName: '.', identifier: 'unused-ignored-dep-global' },
  { type: 'ignoreWorkspaces', identifier: 'unused-ignored-workspace' },
]);

test('Find unused dependencies in nested workspaces with default config in production mode (loose)', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
    isStrict: false,
    isProduction: true,
  });

  assert(issues.dependencies['L-1-1/L-1-2/L-1-3/package.json']['package-1-3-dev']);
  assert(issues.unlisted['L-1-1/L-1-2/index.ts']['ignored-dep-L-3']);
  assert(issues.binaries['L-1-1/L-1-2/L-1-3/package.json']['ignored-bin-L-2']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 1,
    binaries: 1,
    processed: 3,
    total: 3,
  });

  assert.deepEqual(configurationHints, expectedConfigurationHints);
});

test('Find unused dependencies in nested workspaces with default config in production mode (strict)', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
    isProduction: true,
  });

  assert(issues.dependencies['L-1-1/L-1-2/L-1-3/package.json']['package-1-3-dev']);
  assert(issues.unlisted['L-1-1/L-1-2/L-1-3/index.ts']['package-1-2']);
  assert(issues.unlisted['L-1-1/L-1-2/index.ts']['ignored-dep-L-3']);
  assert(issues.binaries['L-1-1/L-1-2/L-1-3/package.json']['ignored-bin-L-2']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 2,
    binaries: 1,
    processed: 3,
    total: 3,
  });

  assert.deepEqual(configurationHints, expectedConfigurationHints);
});
