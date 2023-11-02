const config = {
  testRunner: 'mocha',
  checkers: ['typescript'],
  plugins: ['@stryker-mutator/jasmine-framework', '@stryker-mutator/karma-runner'],
};

export default config;
