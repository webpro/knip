import assert from 'node:assert/strict';
import test from 'node:test';
import * as remark from '../../src/plugins/remark/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/remark');
const manifestFilePath = join(cwd, 'package.json');
const manifest = getManifest(cwd);

test('Find dependencies in Remark configuration', async () => {
  const dependencies = await remark.findDependencies(manifestFilePath, { manifest });
  assert.deepEqual(dependencies, ['remark-preset-webpro']);
});
