import assert from 'node:assert/strict';
import test from 'node:test';
import * as nx from '../../src/plugins/nx/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/nx');

test('Find dependencies in Nx configuration (project.json)', async () => {
  const configFilePath = join(cwd, 'apps/a/project.json');
  const dependencies = await nx.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, ['@nrwl/next', '@nrwl/linter', '@nrwl/cypress']);
});

test('Find dependencies in Nx configuration (project.json)', async () => {
  const configFilePath = join(cwd, 'libs/b/project.json');
  const dependencies = await nx.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, ['nx', '@nrwl/jest', 'bin:ls', 'bin:webpack', 'bin:compodoc']);
});
