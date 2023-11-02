require('dotenv').config({ path: '../.env' });

const config = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: false,
        useBuiltIns: 'usage',
        corejs: 2,
        shippedProposals: true,
        targets: {
          browsers: ['>0.25%', 'not dead'],
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    'preval',
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-macros',
    [
      '@babel/plugin-transform-runtime',
      {
        helpers: true,
        regenerator: true,
      },
    ],
    [
      'babel-plugin-transform-imports',
      {
        'react-bootstrap': {
          transform: 'react-bootstrap/lib/${member}',
          preventFullImport: true,
        },
      },
    ],
  ],
};

if (process.env.NODE_ENV === 'development' && process.env.CODESEE === 'true') {
  config.plugins.push(['@codesee/instrument', { hosted: true }]);
}

module.exports = config;
