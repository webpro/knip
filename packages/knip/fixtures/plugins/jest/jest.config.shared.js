const ignorePatterns = ['\\/build\\/', '\\/coverage\\/', '\\/\\.vscode\\/', '\\/\\.tmp\\/', '\\/\\.cache\\/'];
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: './local-preset/jest-preset.js',
  modulePathIgnorePatterns: ignorePatterns,
  watchPathIgnorePatterns: [...ignorePatterns, '\\/node_modules\\/'],
  testMatch: ['<rootDir>/**/*-test.[jt]s?(x)'],
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nrwl/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { cwd: __dirname, configFile: './babel-jest.config.json' }],
    '^.+\\.[jt]sx?$': '<rootDir>/jest.transform.js',
  },
  watchPlugins: [require.resolve('jest-watch-select-projects')],
};
