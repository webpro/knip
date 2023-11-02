import assert from 'node:assert/strict';
import test from 'node:test';
import * as typedoc from '../../src/plugins/typedoc/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/typedoc');
const manifest = getManifest(cwd);

test('Find dependencies in typedoc configuration (json)', async () => {
  const configFilePath = join(cwd, 'typedoc.json');
  const dependencies = await typedoc.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    '@appium/typedoc-plugin-appium',
    'typedoc-plugin-expand-object-like-types',
    './dist/index.cjs',
  ]);
});

test('Find dependencies in typedoc configuration (package.json)', async () => {
  const configFilePath = join(cwd, 'tsconfig.json');
  const dependencies = await typedoc.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['typedoc-plugin-zod']);
});

test('Find dependencies in typedoc configuration (tsconfig.json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await typedoc.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['typedoc-plugin-umami']);
});
