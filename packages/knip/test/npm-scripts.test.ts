import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import * as npm from '../src/manifest/index.js';
import { resolve, join } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';
import { getManifest } from './helpers/index.js';

const cwd = resolve('fixtures/npm-scripts');
const manifest = getManifest(cwd);

test('Referenced dependencies in npm scripts', async () => {
  const config = {
    manifest,
    isProduction: false,
    isStrict: false,
    dir: cwd,
    cwd,
  };

  const { dependencies, hostDependencies, installedBinaries } = await npm.findDependencies(config);

  assert.deepEqual(dependencies, [
    'bin:nodemon',
    join(cwd, 'script.js'),
    'bin:rm',
    'bin:dotenv',
    'bin:nx',
    'bin:pm2',
    'bin:pm2-dev',
    'bin:eslint',
    'bin:commitlint',
    'bin:bash',
    join(cwd, 'ignore.js'),
    'bin:package',
    'bin:runnable',
  ]);

  const expectedHostDependencies = new Map();
  expectedHostDependencies.set('pm2-peer-dep', new Set(['pm2']));

  assert.deepEqual(hostDependencies, expectedHostDependencies);

  assert.deepEqual(
    installedBinaries,
    new Map([
      ['pm2', new Set(['pm2', 'pm2-dev', 'pm2-docker', 'pm2-runtime'])],
      ['pm2-dev', new Set(['pm2'])],
      ['pm2-docker', new Set(['pm2'])],
      ['pm2-runtime', new Set(['pm2'])],
      ['runnable', new Set(['@org/runnable'])],
      ['nx', new Set(['nx'])],
      ['package', new Set(['package-cli'])],
      ['package-cli', new Set(['package'])],
      ['unused', new Set(['unused'])],
      ['eslint', new Set(['eslint', 'eslint-v6', 'eslint-v7', 'eslint-v8'])],
      ['eslint-v6', new Set(['eslint'])],
      ['eslint-v7', new Set(['eslint'])],
      ['eslint-v8', new Set(['eslint'])],
      ['@commitlint/cli', new Set(['commitlint'])],
      ['@org/runnable', new Set(['runnable'])],
      ['commitlint', new Set(['@commitlint/cli'])],
    ])
  );
});

test('Unused dependencies in npm scripts', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['express']);

  assert(issues.devDependencies['package.json']['unused']);
  assert(!issues.devDependencies['package.json']['eslint-v6']);
  assert(!issues.devDependencies['package.json']['eslint-v7']);
  assert(!issues.devDependencies['package.json']['eslint-v8']);

  assert(issues.binaries['package.json']['nodemon']);
  assert(issues.binaries['package.json']['dotenv']);
  assert(!issues.binaries['package.json']['rm']);
  assert(!issues.binaries['package.json']['bash']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    devDependencies: 1,
    binaries: 2,
    processed: 1,
    total: 1,
  });

  assert.deepEqual(
    configurationHints,
    new Set([
      { workspaceName: '.', identifier: 'rm', type: 'ignoreBinaries' },
      { workspaceName: '.', identifier: 'bash', type: 'ignoreBinaries' },
      { workspaceName: '.', identifier: 'eslint', type: 'ignoreBinaries' },
    ])
  );
});

test('Unused dependencies in npm scripts (strict)', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert(issues.dependencies['package.json']['express']);
  assert(issues.dependencies['package.json']['unused-peer-dep']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 2,
    processed: 1,
    total: 1,
  });

  assert.deepEqual(
    configurationHints,
    new Set([
      { workspaceName: '.', identifier: 'rm', type: 'ignoreBinaries' },
      { workspaceName: '.', identifier: 'bash', type: 'ignoreBinaries' },
    ])
  );
});
