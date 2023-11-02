import assert from 'node:assert/strict';
import test from 'node:test';
import * as stryker from '../../src/plugins/stryker/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/stryker');

test('Find dependencies in Stryker configuration (js)', async () => {
  const configFilePath = join(cwd, '.stryker.conf.js');
  const dependencies = await stryker.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, [
    '@stryker-mutator/mocha-runner',
    '@stryker-mutator/typescript-checker',
    '@stryker-mutator/jasmine-framework',
    '@stryker-mutator/karma-runner',
  ]);
});

test('Find dependencies in Stryker configuration (mjs)', async () => {
  const configFilePath = join(cwd, 'stryker.conf.mjs');
  const dependencies = await stryker.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, [
    '@stryker-mutator/mocha-runner',
    '@stryker-mutator/typescript-checker',
    '@stryker-mutator/jasmine-framework',
    '@stryker-mutator/karma-runner',
  ]);
});

test('Find dependencies in Stryker configuration (cjs)', async () => {
  const configFilePath = join(cwd, 'stryker.conf.cjs');
  const dependencies = await stryker.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, [
    '@stryker-mutator/mocha-runner',
    '@stryker-mutator/typescript-checker',
    '@stryker-mutator/jasmine-framework',
    '@stryker-mutator/karma-runner',
  ]);
});

test('Find dependencies in Stryker configuration (json)', async () => {
  const configFilePath = join(cwd, 'stryker.conf.json');
  const dependencies = await stryker.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, [
    '@stryker-mutator/karma-runner',
    '@stryker-mutator/typescript-checker',
    '@stryker-mutator/karma-runner',
  ]);
});
