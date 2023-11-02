import assert from 'node:assert/strict';
import test from 'node:test';
import * as angular from '../../src/plugins/angular/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/angular');
const manifest = getManifest(cwd);

test('Find dependencies in angular configuration (json)', async () => {
  const configFilePath = join(cwd, 'angular.json');
  const dependencies = await angular.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, ['@angular-devkit/build-angular', join(cwd, 'src/main.ts'), 'jasmine']);
});
