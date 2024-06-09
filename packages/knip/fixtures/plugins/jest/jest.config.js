/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...require('./jest.config.shared'),
  displayName: 'dev',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  setupFiles: [],
  moduleNameMapper: {
    '\\.(jpg|jpeg|...|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': 'identity-obj-proxy',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^src/(.*)$': '<rootDir>/../src/$1',
  },
  reporters: [
    'default',
    'jest-silent-reporter',
    ['jest-junit', { outputDirectory: 'reports', outputName: 'report.xml' }],
    ['github-actions', { silent: false }],
    'summary',
  ],
  projects: [
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.js'],
    },
  ],
  testResultsProcessor: 'jest-phabricator',
  snapshotResolver: '<rootDir>/snapshotResolver.js',
  runtime: '@side/jest-runtime',
};
