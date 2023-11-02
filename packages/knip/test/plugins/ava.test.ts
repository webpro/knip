import assert from 'node:assert/strict';
import test from 'node:test';
import * as ava from '../../src/plugins/ava/index.js';
import { join, resolve } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/ava');
const manifest = getManifest(cwd);

test('Find dependencies in ava configuration (package.json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await ava.findDependencies(configFilePath, { cwd, manifest, config });
  assert.deepEqual(dependencies, ['entry:**/*.test.*', 'ts-node']);
});

test('Find dependencies in ava configuration (ava.config.mjs)', async () => {
  const configFilePath = join(cwd, 'ava.config.mjs');
  const dependencies = await ava.findDependencies(configFilePath, { cwd, manifest, config });
  assert.deepEqual(dependencies, ['entry:**/*.test.*', 'tsconfig-paths']);
});
