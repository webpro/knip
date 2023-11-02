import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from '../src/util/path.js';
import { execFactory } from './helpers/execKnip.js';

const cwd = resolve('fixtures/cli-reporter');

const exec = execFactory(cwd);

test('knip --reporter ./index.js', () => {
  assert.equal(exec('knip --reporter ./index.js'), 'hi from js reporter');
});

test('knip --reporter ./index.ts', () => {
  assert.equal(exec('knip --reporter ./index.ts'), 'hi from ts reporter');
});

test('knip --reporter knip-reporter', () => {
  assert.equal(exec('knip --reporter knip-reporter'), 'hi from pkg reporter');
});

test('knip --reporter @org/reporter', () => {
  assert.equal(exec('knip --reporter @org/reporter'), 'hi from scoped reporter');
});
