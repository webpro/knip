const { basename } = require('node:path');
const esbuild = require('esbuild');
const HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = () => {
  return {
    module: {
      rules: [
        { test: /\.svg/, use: 'svg-url-loader' },
        {
          test: /\.(js|ts)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env'], ['@babel/typescript', { jsxPragma: 'h' }]],
              plugins: [
                '@babel/proposal-class-properties',
                [
                  '@babel/plugin-transform-react-jsx',
                  {
                    pragma: 'h',
                    pragmaFrag: 'Fragment',
                  },
                ],
                'babel-plugin-macros',
                'babel-plugin-styled-components',
              ],
            },
          },
        },
        {
          test: /(\.ts)x|\.ts$/,
          use: () => [
            {
              loader: 'ts-loader',
            },
          ],
        },
        {
          test: /(\.js)x|\.js$/,
          loader: 'esbuild-loader',
          options: {
            implementation: esbuild,
          },
        },
        {
          test: /\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'less-loader',
            },
          ],
        },
        info => ({
          loader: 'svgo-loader',
          options: {
            plugins: [
              {
                cleanupIDs: { prefix: basename(info.resource) },
              },
            ],
          },
        }),
      ],
    },
    plugins: [
      new MiniCssExtractPlugin(),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
    optimization: {
      minimizer: [new HtmlMinimizerPlugin({ parallel: true })],
    },
  };
};
