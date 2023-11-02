import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePluginSpecifier, resolveExtendSpecifier } from '../../src/plugins/eslint/helpers.js';
import * as eslint from '../../src/plugins/eslint/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/eslint');
const manifest = getManifest(cwd);

test('Find dependencies in ESLint configuration (legacy json)', async () => {
  const configFilePath = join(cwd, '.eslintrc.json');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, [
    join(cwd, 'base.eslint.json'),
    'eslint',
    'eslint-plugin-import',
    '@typescript-eslint/parser',
    'eslint-config-airbnb',
    '@typescript-eslint/eslint-plugin/eslint-recommended',
    '@typescript-eslint/eslint-plugin/recommended',
    'eslint-config-prettier',
    '@typescript-eslint/eslint-plugin',
    '@babel/plugin-syntax-import-assertions',
  ]);
});

test('Find dependencies in ESLint configuration (legacy js)', async () => {
  const configFilePath = join(cwd, '.eslintrc.js');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, [
    join(cwd, 'base.eslint.json'),
    'eslint',
    'eslint-plugin-import',
    '@typescript-eslint/parser',
    'eslint-config-airbnb',
    '@typescript-eslint/eslint-plugin/recommended',
    '@typescript-eslint/eslint-plugin/eslint-recommended',
    '@typescript-eslint/eslint-plugin/stylistic-type-checked',
    'next/core-web-vitals',
    '@next/eslint-plugin-next/recommended',
    'eslint-plugin-eslint-comments/recommended',
    'eslint-plugin-eslint-plugin/all',
    '@scope/eslint-config/file',
    'eslint-plugin-prettier/recommended',
    'eslint-config-prettier',
    '@typescript-eslint/eslint-plugin',
    '@nrwl/eslint-plugin-nx',
    'eslint-plugin-cypress',
    '@scope-only/eslint-plugin',
    '@scope/eslint-plugin',
    'eslint-import-resolver-typescript',
    'eslint-import-resolver-exports',
  ]);
});

test('Find dependencies in ESLint configuration (legacy yaml)', async () => {
  const configFilePath = join(cwd, '.eslintrc.yml');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, ['@sinonjs/eslint-config', '@sinonjs/eslint-plugin-no-prototype-methods']);
});

test('Find dependencies in ESLint configuration (custom prettier config)', async () => {
  const configFilePath = join(cwd, '.eslintrc.cjs');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, ['eslint', 'eslint-plugin-prettier/recommended', 'eslint-config-prettier']);
});

test('ESLint configuration resolvePluginSpecifier helper', () => {
  const r = resolvePluginSpecifier;

  assert.equal(r('import'), 'eslint-plugin-import');
  assert.equal(r('eslint-plugin-import'), 'eslint-plugin-import');
  assert.equal(r('@scope/name'), '@scope/eslint-plugin-name');
  assert.equal(r('@scope'), '@scope/eslint-plugin');
});

test('ESLint configuration resolveExtendSpecifier helper', () => {
  const r = resolveExtendSpecifier;

  assert.equal(r('./local.eslint.json'), undefined);

  assert.equal(r('eslint:recommended'), 'eslint');
  assert.equal(r('airbnb'), 'eslint-config-airbnb');
  assert.equal(r('eslint-config-airbnb'), 'eslint-config-airbnb');
  assert.equal(r('@scope/eslint-config/file'), '@scope/eslint-config/file');

  // plugin:
  assert.equal(r('plugin:eslint-comments/recommended'), 'eslint-plugin-eslint-comments/recommended');
  assert.equal(r('plugin:eslint-plugin/all'), 'eslint-plugin-eslint-plugin/all');
  assert.equal(r('plugin:prettier/recommended'), 'eslint-plugin-prettier/recommended');
  assert.equal(r('plugin:@typescript-eslint/strict'), '@typescript-eslint/eslint-plugin/strict');
  assert.equal(r('plugin:@shopify/esnext'), '@shopify/eslint-plugin/esnext');
  assert.equal(r('plugin:@next/next/recommended'), '@next/eslint-plugin-next/recommended');

  // Exceptions
  assert.equal(r('next'), 'next');
  assert.equal(r('next/core-web-vitals'), 'next/core-web-vitals');
});
