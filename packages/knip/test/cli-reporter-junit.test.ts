import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from '../src/util/path.js';
import { execFactory } from './helpers/exec.js';

const cwd = resolve('fixtures/module-resolution-non-std');

const exec = execFactory(cwd);

test('knip --reporter junit', () => {
  const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Knip report" tests="4" failures="4">
  <testsuite name="Unused files" tests="1" failures="1">
    <testcase tests="1" failures="1" name="Unused files" classname="src/unused.ts">
      <failure message="Unused files" type="Unused files">Unused files: src/unused.ts</failure>
    </testcase>
  </testsuite>
  <testsuite name="Unlisted dependencies" tests="2" failures="2">
    <testcase tests="1" failures="1" name="Unlisted dependencies" classname="src/index.ts">
      <failure message="Unlisted dependencies - unresolved" type="Unlisted dependencies">Unlisted dependencies: "unresolved" inside src/index.ts</failure>
    </testcase>
    <testcase tests="1" failures="1" name="Unlisted dependencies" classname="src/index.ts">
      <failure message="Unlisted dependencies - @org/unresolved" type="Unlisted dependencies">Unlisted dependencies: "@org/unresolved" inside src/index.ts</failure>
    </testcase>
  </testsuite>
  <testsuite name="Unresolved imports" tests="1" failures="1">
    <testcase tests="1" failures="1" name="Unresolved imports" classname="src/index.ts:8:23">
      <failure message="Unresolved imports - ./unresolved" type="Unresolved imports">Unresolved imports: "./unresolved" inside src/index.ts:8:23</failure>
    </testcase>
  </testsuite>
</testsuites>`;

  const out = exec('knip --reporter junit').stdout;
  assert.equal(out.trim(), xml.trim());
});
