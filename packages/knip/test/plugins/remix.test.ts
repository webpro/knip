import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/remix');

test('Find dependencies in Remix configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['app/root.tsx']['./session.server']);

  assert(issues.unlisted['package.json']['dotenv']);
  assert(issues.binaries['package.json']['run-s']);
  assert(issues.binaries['package.json']['run-p']);
  assert(issues.binaries['package.json']['cross-env']);
  assert(issues.binaries['package.json']['tailwindcss']);
  assert(issues.binaries['package.json']['prisma']);

  assert(issues.unlisted['app/entry.client.tsx']['@remix-run/react']);
  assert(issues.unlisted['app/entry.client.tsx']['react']);
  assert(issues.unlisted['app/entry.client.tsx']['react-dom/client']);

  assert(issues.unlisted['app/entry.server.tsx']['@remix-run/node']);
  assert(issues.unlisted['app/entry.server.tsx']['@remix-run/react']);
  assert(issues.unlisted['app/entry.server.tsx']['react-dom/server']);

  assert(issues.unlisted['app/root.tsx']['@remix-run/node']);
  assert(issues.unlisted['app/root.tsx']['@remix-run/react']);

  assert(issues.unlisted['app/utils.ts']['@remix-run/react']);
  assert(issues.unlisted['app/utils.ts']['react']);

  assert(issues.unlisted['app/routes/index.tsx']['@remix-run/react']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 12,
    binaries: 5,
    unresolved: 1,
    processed: 8,
    total: 8,
  });
});
