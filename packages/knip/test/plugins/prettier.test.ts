import assert from 'node:assert/strict';
import test from 'node:test';
import * as prettier from '../../src/plugins/prettier/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/prettier');

test('Find dependencies in Prettier configuration', async () => {
  const configFilePath = join(cwd, '.prettierrc');
  const dependencies = await prettier.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['prettier-plugin-xml']);
});
