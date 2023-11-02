module.exports = {
  root: true,
  extends: [
    require.resolve('./base.eslint.json'),
    'airbnb',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'next/core-web-vitals',
    'plugin:@next/next/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:eslint-plugin/all',
    '@scope/eslint-config/file',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', '@nrwl/nx', 'eslint-plugin-cypress', '@scope-only', '@scope/eslint-plugin'],
  settings: {
    'import/resolver': {
      typescript: true,
      exports: true,
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
