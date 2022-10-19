import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src';

test('Find unused dependencies', async () => {
  const workingDir = 'test/fixtures/dependencies';

  const { issues, counters } = await main({
    cwd: workingDir,
    workingDir,
    include: [],
    exclude: [],
    ignore: [],
    gitignore: false,
    isIncludeEntryFiles: false,
    isDev: false,
    isShowProgress: false,
    jsDoc: [],
    debug: {
      isEnabled: false,
      level: 0,
    },
  });

  assert(Array.from(issues.files)[0].endsWith('unused.ts'));
  assert.equal(issues.dependencies.size, 3);
  assert(issues.dependencies.has('@tootallnate/once'));
  assert(issues.dependencies.has('jquery'));
  assert(issues.dependencies.has('fs-extra'));
  assert(!issues.dependencies.has('mocha'));

  assert.equal(Object.keys(issues.unlisted).length, 2);
  assert(issues.unlisted['dep.ts']['ansi-regex']);
  assert(issues.unlisted['entry.ts']['not-exist']);

  assert.deepEqual(counters, {
    dependencies: 3,
    devDependencies: 0,
    duplicates: 0,
    exports: 0,
    files: 1,
    nsExports: 0,
    nsTypes: 0,
    processed: 3,
    total: 3,
    types: 0,
    unlisted: 3,
  });
});
