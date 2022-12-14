import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as eslint from '../../../src/plugins/eslint/index.js';
import { getManifest } from '../../helpers';

const cwd = path.resolve('test/fixtures/plugins/eslint');
const manifest = getManifest(cwd);
const workspaceConfig = {
  entry: ['index.{js,ts,tsx}', 'src/index.{js,ts,tsx}'],
  project: ['**/*.{js,ts,tsx}'],
  ignore: [],
};

test('Find dependencies in ESLint configuration (legacy json)', async () => {
  const configFilePath = path.join(cwd, '.eslintrc.json');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest, workspaceConfig });
  assert.deepEqual(dependencies, [
    'eslint-config-airbnb',
    '@typescript-eslint/eslint-plugin',
    'eslint-plugin-prettier',
    'eslint-config-prettier',
    '@typescript-eslint/parser',
    'eslint-plugin-import',
  ]);
});

test('Find dependencies in ESLint configuration (legacy js)', async () => {
  const configFilePath = path.join(cwd, '.eslintrc.js');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest, workspaceConfig });
  assert.deepEqual(dependencies, [
    'eslint-config-airbnb',
    'eslint-plugin-prettier',
    '@typescript-eslint/eslint-plugin',
    '@scope/eslint-config',
    'eslint-config-prettier',
    '@typescript-eslint/parser',
    'eslint-plugin-import',
    '@nrwl/eslint-plugin-nx',
  ]);
});

test('Find dependencies in ESLint configuration (legacy yaml)', async () => {
  const configFilePath = path.join(cwd, '.eslintrc.yml');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest, workspaceConfig });
  assert.deepEqual(dependencies, [
    '@sinonjs/eslint-config',
    'eslint-plugin-jsdoc',
    'eslint-plugin-compat',
    '@sinonjs/eslint-plugin-no-prototype-methods',
  ]);
});
