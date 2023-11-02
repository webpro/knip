exports.onCreateBabelConfig = ({ actions }) => {
  actions.setBabelPlugin({
    name: '@babel/plugin-proposal-function-bind',
  });
  actions.setBabelPlugin({
    name: '@babel/plugin-proposal-export-default-from',
  });
  actions.setBabelPlugin({
    name: 'babel-plugin-transform-imports',
    options: {
      preventFullImport: true,
    },
  });
};
