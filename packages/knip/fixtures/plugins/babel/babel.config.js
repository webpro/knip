const _ = require('underscore');

const isNodeCaller = caller => caller && (caller.name === '@babel/register' || caller.name === 'babel-jest');
const isDistCaller = caller => !!(caller && caller.name === 'babel-gulp');
const supportsESM = caller => !!((caller && caller.name === 'babel-loader') || caller.useESModules);

module.exports = api => {
  api.cache(true);

  const isDistBundle = api.caller(isDistCaller);
  const isNode = api.caller(isNodeCaller);
  const useESModules = !isNode && api.caller(supportsESM);

  const presets = [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: useESModules ? false : 'cjs',
        targets: isNode ? { node: '10' } : undefined,
        exclude: ['proposal-object-rest-spread', 'transform-async-to-generator'],
      },
    ],
    ['@babel/preset-typescript', { allowNamespaces: true }],
  ];
  const plugins = [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
    ['@babel/plugin-proposal-object-rest-spread', { loose: true, useBuiltIns: true }],
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
    '@babel/plugin-syntax-dynamic-import',
    ['@babel/plugin-transform-runtime', { useESModules }],

    useESModules && 'babel-plugin-iife-wrap-react-components',
    useESModules && [
      'babel-plugin-annotate-pure-imports',
      {
        imports: {
          '@fluentui/react-bindings': 'compose',
          '@fluentui/react-context-selector': 'createContext',
          '../utils/createSvgIcon': ['createSvgIcon'],
        },
      },
    ],
    isDistBundle && 'lodash',
  ].filter(Boolean);

  return {
    presets,
    plugins,
  };
};
