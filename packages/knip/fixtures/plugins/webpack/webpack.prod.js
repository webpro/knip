const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const merge = require('./merge.js');
const common = require('./webpack.common.js');

module.exports = env =>
  merge(common(), {
    mode: 'production',
    entry: './src/entry.js',
    module: {
      rules: [],
    },
    plugins: [new CopyWebpackPlugin()],
    optimization: {
      minimizer: [new TerserWebpackPlugin()],
    },
  });
