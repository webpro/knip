import assert from 'node:assert/strict';
import test from 'node:test';
import * as lintStaged from '../../src/plugins/lint-staged/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/lint-staged');
const manifest = getManifest(cwd);

test('Find dependencies in lint-staged configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await lintStaged.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['bin:eslint', 'bin:prettier']);
});

test('Find dependencies in lint-staged configuration (js)', async () => {
  const configFilePath = join(cwd, '.lintstagedrc.js');
  const dependencies = await lintStaged.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['bin:eslint', 'bin:prettier']);
});
