import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import * as postcss from '../../src/plugins/postcss/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/postcss-cjs');
const manifestFilePath = join(cwd, 'package.json');
const manifest = getManifest(cwd);

test('Find dependencies in PostCSS configuration (package.json)', async () => {
  const dependencies = await postcss.findDependencies(manifestFilePath, { manifest });
  assert.deepEqual(dependencies, ['autoprefixer']);
});

test('Find dependencies in PostCSS configuration (postcss.config.cjs)', async () => {
  const configFilePath = join(cwd, 'postcss.config.cjs');
  const dependencies = await postcss.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, []);
});

test('Find dependencies in PostCSS configuration (postcss.config.cjs function)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['package.json']['autoprefixer']);
  assert(issues.unlisted['postcss.config.cjs']['autoprefixer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 2,
    processed: 1,
    total: 1,
  });
});
