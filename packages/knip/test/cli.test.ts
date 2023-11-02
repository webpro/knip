import assert from 'node:assert/strict';
import test from 'node:test';
import { helpText } from '../src/util/cli-arguments.js';
import { resolve } from '../src/util/path.js';
import { version } from '../src/version.js';
import { execFactory } from './helpers/execKnip.js';

const cwd = resolve('fixtures/cli');

const exec = execFactory(cwd);

test('knip --version', () => {
  assert.equal(exec('knip --version'), version);
});

test('knip --help', () => {
  assert.equal(exec('knip --help'), helpText);
});
