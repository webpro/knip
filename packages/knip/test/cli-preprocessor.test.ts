import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from '../src/util/path.js';
import { execFactory } from './helpers/execKnip.js';

const cwd = resolve('fixtures/cli-preprocessor');

const exec = execFactory(cwd);

test('knip --preprocessor ./index.js', () => {
  assert.equal(exec('knip --preprocessor ./index.js'), 'hi from js preprocessor');
});

test('knip --preprocessor ./index.ts', () => {
  assert.equal(exec('knip --preprocessor ./index.ts'), 'hi from ts preprocessor');
});

test('knip --preprocessor knip-preprocessor', () => {
  assert.equal(exec('knip --preprocessor knip-preprocessor'), 'hi from pkg preprocessor');
});

test('knip --preprocessor @org/preprocessor', () => {
  assert.equal(exec('knip --preprocessor @org/preprocessor'), 'hi from scoped preprocessor');
});

test(`knip --preprocessor with-args --preprocessor-options {"food":"cupcake"}`, () => {
  assert.equal(
    exec(`knip --preprocessor with-args --preprocessor-options {\\"food\\":\\"cupcake\\"}`),
    'hi from with-args preprocessor, you gave me: cupcake'
  );
});
