import assert from 'node:assert/strict';
import test from 'node:test';
import * as NpmPkgJsonLintConfig from '../../src/plugins/npm-package-json-lint/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/npm-package-json-lint');
const manifest = getManifest(cwd);

test('Find dependencies in npm-package-json-lint configuration (json)', async () => {
  const configFilePath = join(cwd, '.npmpackagejsonlintrc.json');
  const dependencies = await NpmPkgJsonLintConfig.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['npm-package-json-lint-config-default']);
});
