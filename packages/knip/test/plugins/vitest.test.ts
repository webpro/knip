import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import * as vitest from '../../src/plugins/vitest/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/vitest');
const manifest = getManifest(cwd);

test('Find dependencies in vitest configuration (vitest)', async () => {
  const configFilePath = join(cwd, 'vitest.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { cwd, manifest, config });
  assert.deepEqual(dependencies, [
    'entry:**/*.{test,spec}.?(c|m)[jt]s?(x)',
    'happy-dom',
    '@vitest/coverage-istanbul',
    './setup.js',
    './src/setupTests.ts',
  ]);
});

test('Find dependencies in vitest configuration without coverage providers (vitest)', async () => {
  const configFilePath = join(cwd, 'vitest-default-coverage.config');
  const dependencies = await vitest.findDependencies(configFilePath, { cwd, manifest, config });
  assert.deepEqual(dependencies, ['entry:**/*.{test,spec}.?(c|m)[jt]s?(x)', 'jsdom', '@vitest/coverage-v8']);
});

test('Find dependencies in vitest configuration (vite)', async () => {
  const configFilePath = join(cwd, 'vite.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { cwd, manifest, config });
  assert.deepEqual(dependencies, [
    'entry:**/*.{test,spec}.?(c|m)[jt]s?(x)',
    '@vitest/coverage-c8',
    './setup.js',
    './global.ts',
    '@edge-runtime/vm',
  ]);
});

test('Find dependencies in vitest configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['vitest.workspace.ts']['@edge-runtime/vm']);
  assert(issues.unlisted['vitest.config.ts']['happy-dom']);
  assert(issues.unlisted['vitest.config.ts']['@vitest/coverage-istanbul']);
  assert(issues.unresolved['vitest.config.ts']['./setup.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    unlisted: 3,
    unresolved: 1,
    processed: 6,
    total: 6,
  });
});
