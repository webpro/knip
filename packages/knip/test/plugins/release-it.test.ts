import assert from 'node:assert/strict';
import test from 'node:test';
import * as releaseIt from '../../src/plugins/release-it/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/release-it');

test('Find dependencies in Release It configuration (json)', async () => {
  const configFilePath = join(cwd, '.release-it.json');
  const dependencies = await releaseIt.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, [
    '@release-it/bumper',
    '@release-it/conventional-changelog',
    'bin:npm',
    'bin:from-hook',
    join(cwd, 'bin/release-notes.js'),
  ]);
});
