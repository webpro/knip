import assert from 'node:assert/strict';
import test from 'node:test';
import * as nodeTestRunner from '../../src/plugins/node-test-runner/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/node-test-runner');
const manifest = getManifest(cwd);

test('Find dependencies in node-test-runner configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await nodeTestRunner.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    'entry:**/test.{js,cjs,mjs}',
    'entry:**/test-*.{js,cjs,mjs}',
    'entry:**/*{.,-,_}test.{js,cjs,mjs}',
    'entry:**/test/**/*.{js,cjs,mjs}',
  ]);
});
