import assert from 'node:assert/strict';
import test from 'node:test';
import * as typescript from '../../src/plugins/typescript/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/typescript');

test('Find dependencies in typescript configuration', async () => {
  const configFilePath = join(cwd, 'tsconfig.json');
  const dependencies = await typescript.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, [
    '@tsconfig/node16/tsconfig.json',
    'typescript-eslint-language-service',
    'ts-graphql-plugin',
    'tslib',
  ]);
});

test('Find dependencies in typescript configuration (jsx-preserve)', async () => {
  const configFilePath = join(cwd, 'tsconfig-jsx-preserve.json');
  const dependencies = await typescript.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, []);
});

test('Find dependencies in typescript configuration (jsx)', async () => {
  const configFilePath = join(cwd, 'tsconfig-jsx.json');
  const dependencies = await typescript.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, []);
});

test('Find dependencies in typescript configuration (jsx-import-source)', async () => {
  const configFilePath = join(cwd, 'tsconfig-jsx-import-source.json');
  const dependencies = await typescript.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['preact']);
});

test('Find dependencies in typescript configuration (extends)', async () => {
  const configFilePath = join(cwd, 'tsconfig.base.json');
  const dependencies = await typescript.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['@tsconfig/node20/tsconfig.json']);
});

test('Find dependencies in typescript configuration (jsxImportSource)', async () => {
  const configFilePath = join(cwd, 'tsconfig-jsxImportSource.json');
  const dependencies = await typescript.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['vitest/globals', 'hastscript/svg']);
});

test('Find dependencies in typescript configuration (jsxImportSource/production)', async () => {
  const configFilePath = join(cwd, 'tsconfig-jsxImportSource.json');
  const dependencies = await typescript.findDependencies(configFilePath, { isProduction: true });
  assert.deepEqual(dependencies, ['hastscript/svg']);
});
