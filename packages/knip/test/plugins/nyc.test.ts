import assert from 'node:assert/strict';
import test from 'node:test';
import * as nyc from '../../src/plugins/nyc/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/nyc');

test('Find dependencies in nyc configuration', async () => {
  const configFilePath = join(cwd, '.nycrc.json');
  const dependencies = await nyc.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['@istanbuljs/nyc-config-typescript']);
});
