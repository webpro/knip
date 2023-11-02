import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import * as babel from '../../src/plugins/babel/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/babel');
const manifest = getManifest(cwd);

test('Find dependencies in Babel configuration (.babelrc)', async () => {
  const configFilePath = join(cwd, '.babelrc');
  const dependencies = await babel.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    '@babel/preset-env',
    '@babel/preset-typescript',
    'react-hot-loader/babel',
    '@babel/plugin-proposal-decorators',
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-macros',
    'babel-preset-minify',
  ]);
});

test('Find dependencies in Babel configuration (.babelrc.js)', async () => {
  const configFilePath = join(cwd, '.babelrc.js');
  const dependencies = await babel.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    '@babel/preset-env',
    '@babel/preset-typescript',
    'babel-plugin-preval',
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-macros',
    '@babel/plugin-transform-runtime',
    'babel-plugin-transform-imports',
  ]);
});

test('Find dependencies in Babel configuration (babel.config.js)', async () => {
  const configFilePath = join(cwd, 'babel.config.js');
  const dependencies = await babel.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    '@babel/preset-env',
    '@babel/preset-typescript',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-runtime',
    'babel-plugin-lodash',
  ]);
});

test('Find dependencies in Babel configuration (package.json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await babel.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['@babel/preset-env']);
});

test('External dependency in Babel configuration (.babelrc.js)', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
  });

  // This verifies that .babelrc.js is added as entry file and its external module specifiers are found
  assert(issues.unlisted['.babelrc.js']['dotenv']);
});
