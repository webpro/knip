import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-plugin-config');

test('Use root plugin config in workspaces', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    total: 23,
    processed: 23,
  });
});

test('Use root plugin config in workspaces (strict production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert.deepEqual(
    issues.files,
    new Set([
      join(cwd, 'packages/frontend/components/component.js'),
      join(cwd, 'packages/package1/components/component.js'),
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    total: 5,
    processed: 5,
  });
});
