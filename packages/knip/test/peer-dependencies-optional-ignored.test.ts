import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/peer-dependencies-optional-ignored');

test('Find no issues/hints if optional peerDependencies are also ignored (dev)Dependencies', async () => {
  const { counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(configurationHints.size, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
