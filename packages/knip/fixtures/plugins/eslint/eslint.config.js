import prettier from 'eslint-plugin-prettier';
import noSecrets from 'eslint-plugin-no-secrets';

export default [
  'eslint:recommended',
  {
    plugins: {
      prettier,
      'no-secrets': noSecrets,
    },
  },
];
