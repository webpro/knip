const avaConfig = {
  files: ['**/*.test.*'],
  extensions: ['js'],
  require: ['tsconfig-paths/register'],
  typescript: {
    rewritePaths: {
      'src/': 'build/src/',
      'tests/': 'build/tests/',
    },
    compile: false,
  },
};

export default avaConfig;
