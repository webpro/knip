import assert from 'node:assert/strict';
import test from 'node:test';
import * as gatsby from '../../src/plugins/gatsby/index.js';
import { resolve, join } from '../../src/util/path.js';
import { pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/gatsby');

test('Find dependencies in Gatsby configuration (gatsby-config.js)', async () => {
  const configFilePath = join(cwd, 'gatsby-config.js');
  const dependencies = await gatsby.findDependencies(configFilePath, { config });
  assert.deepEqual(dependencies, [
    '@sentry/gatsby',
    'gatsby-plugin-webpack-bundle-analyser-v2',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-postcss',
    'gatsby-plugin-create-client-paths',
    'gatsby-source-filesystem',
    'gatsby-transformer-remark',
    'gatsby-remark-node-identity',
    'gatsby-remark-node-identity',
    'gatsby-plugin-manifest',
    'gatsby-plugin-remove-serviceworker',
  ]);
});

test('Find dependencies in Gatsby configuration (gatsby-node.js)', async () => {
  const configFilePath = join(cwd, 'gatsby-node.js');
  const dependencies = await gatsby.findDependencies(configFilePath, { config });
  assert.deepEqual(dependencies, [
    '@babel/plugin-proposal-function-bind',
    '@babel/plugin-proposal-export-default-from',
    'babel-plugin-transform-imports',
  ]);
});
