import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/peer-dependencies-optional');

test('Find referenced optional peerDependencies', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.optionalPeerDependencies['package.json']['pg']);
  assert(issues.optionalPeerDependencies['package.json']['@types/pg']);

  assert.deepEqual(counters, {
    ...baseCounters,
    optionalPeerDependencies: 2,
    processed: 1,
    total: 1,
  });
});
