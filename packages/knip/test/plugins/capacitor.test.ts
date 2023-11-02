import assert from 'node:assert/strict';
import test from 'node:test';
import * as capacitor from '../../src/plugins/capacitor/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/capacitor');

test('Find dependencies in Capacitor configuration (ts)', async () => {
  const configFilePath = join(cwd, 'capacitor.config.ts');
  const dependencies = await capacitor.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, [
    '@capacitor-community/http',
    '@capacitor/app',
    '@capacitor/ios',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
    '@capacitor/storage',
    'cordova-plugin-inappbrowser',
  ]);
});

test('Find dependencies in Capacitor configuration (json)', async () => {
  const configFilePath = join(cwd, 'capacitor.config.json');
  const dependencies = await capacitor.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, [
    '@capacitor-community/http',
    '@capacitor/android',
    '@capacitor/app',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
    '@capacitor/storage',
    'cordova-plugin-inappbrowser',
  ]);
});
