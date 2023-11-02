import 'webpack';

const config = [
  {
    entry: './production-entry.js',
  },
  {
    mode: 'development',
    entry: './dev-entry.js',
  },
];

module.exports = config;
