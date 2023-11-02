import assert from 'node:assert/strict';
import test from 'node:test';
import * as stylelint from '../../src/plugins/stylelint/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/stylelint');
const manifest = getManifest(cwd);

test('Find dependencies in stylelint configuration (json)', async () => {
  const configFilePath = join(cwd, '.stylelintrc');
  const dependencies = await stylelint.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['stylelint-config-standard', 'stylelint-order']);
});
