import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';

const cwd = resolve('fixtures/gitignore');

test('Obey gitignore', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
    gitignore: true,
  });

  assert.equal(issues.files.size, 0);
});

test('Ignore gitignore', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
    gitignore: false,
  });

  assert.equal(issues.files.size, 3);
});
