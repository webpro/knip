import assert from 'node:assert/strict';
import test from 'node:test';
import * as cspell from '../../src/plugins/cspell/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/cspell');

test('Find dependencies in cspell configuration (json)', async () => {
  const configFilePath = join(cwd, '.cspell.json');
  const dependencies = await cspell.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['@cspell/dict-cryptocurrencies/cspell-ext.json']);
});
