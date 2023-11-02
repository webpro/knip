import assert from 'node:assert/strict';
import test from 'node:test';
import * as mocha from '../../src/plugins/mocha/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/mocha');
const manifest = getManifest(cwd);

test('Find dependencies in Mocha configuration (.mocharc.json)', async () => {
  const configFilePath = join(cwd, '.mocharc.json');
  const dependencies = await mocha.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, ['ts-node/register', 'entry:**/test/*.{js,cjs,mjs}']);
});

test('Find dependencies in Mocha configuration (package.json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await mocha.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, ['ts-node/register', 'entry:**/test/*.{js,cjs,mjs}']);
});

test('Find dependencies in Mocha configuration (.mocharc.yml)', async () => {
  const configFilePath = join(cwd, '.mocharc.yml');
  const dependencies = await mocha.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, ['ts-node/register', 'entry:**/test/*.{js,cjs,mjs}']);
});
