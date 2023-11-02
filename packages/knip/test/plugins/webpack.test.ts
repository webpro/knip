import assert from 'node:assert/strict';
// eslint-disable-next-line n/no-restricted-import
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import * as webpack from '../../src/plugins/webpack/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/webpack');
const manifest = getManifest(cwd);

test('Find dependencies in Webpack configuration (webpack.config.js)', async () => {
  const configFilePath = join(cwd, 'webpack.config.js');
  const dependencies = await webpack.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, [
    'entry:src/app.ts',
    'entry:src/vendor.ts',
    'production:src/entry.js',
    'svg-url-loader',
    'babel-loader',
    '@babel/preset-env',
    '@babel/preset-typescript',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-react-jsx',
    'babel-plugin-macros',
    'babel-plugin-styled-components',
    'ts-loader',
    'esbuild-loader',
    path.join(cwd, 'node_modules/mini-css-extract-plugin/loader.js'),
    'css-loader',
    'less-loader',
    'svgo-loader',
    'base64-inline-loader',
    'webpack-cli',
    'webpack-dev-server',
  ]);
});

test('Find dependencies in Webpack configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'src/unused.ts')));
  assert(issues.devDependencies['package.json']['@babel/plugin-proposal-object-rest-spread']);
  assert(issues.unlisted['webpack.config.js']['svgo-loader']);
  assert(issues.unlisted['webpack.dev.js']['eslint-webpack-plugin']);
  assert(issues.unlisted['webpack.prod.js']['terser-webpack-plugin']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    devDependencies: 1,
    unlisted: 3,
    processed: 10,
    total: 10,
  });
});
