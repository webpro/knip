import assert from 'node:assert/strict';
import test from 'node:test';
import * as changesets from '../../src/plugins/changesets/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/changesets');

test('Find dependencies in Changesets configuration', async () => {
  const configFilePaths = changesets.CONFIG_FILE_PATTERNS.map(filePath => join(cwd, filePath));
  for (const configFilePath of configFilePaths) {
    const dependencies = await changesets.findDependencies(configFilePath, {});
    assert.deepEqual(dependencies, ['@changesets/changelog-github']);
  }
});
