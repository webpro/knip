const path = require('path');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = {
  features: {
    // Enables code splitting
    storyStoreV7: true,
  },
  stories: [],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-knobs/preset',
    'storybook-addon-export-to-codesandbox',
    './addon/register',
  ],
  webpackFinal: config => {
    return config;
  },
  core: {
    builder: 'webpack5',
    lazyCompilation: true,
  },
  framework: {
    name: '@storybook/react-webpack5',
  },
};
