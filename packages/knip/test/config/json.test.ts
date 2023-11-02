import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from '../../src/util/path.js';
import { execFactory } from '../helpers/execKnip.js';

const cwd = resolve('fixtures/config/json');

const exec = execFactory(cwd);

test('Support loading json files for configuration', async () => {
  assert.equal(exec('knip'), '');
});
