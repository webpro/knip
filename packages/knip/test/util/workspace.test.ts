import assert from 'node:assert/strict';
import test from 'node:test';
import { byPathDepth } from '../../src/util/workspace.js';

test('Sort workspaces by path depth', () => {
  assert.deepEqual(['first', 'sec/ond', 'th/i/rd'].sort(byPathDepth), ['first', 'sec/ond', 'th/i/rd']);
  assert.deepEqual(['th/i/rd', 'first', 'sec/ond'].sort(byPathDepth), ['first', 'sec/ond', 'th/i/rd']);
  assert.deepEqual(['apps/*', 'apps/first'].sort(byPathDepth), ['apps/*', 'apps/first']);
  assert.deepEqual(['pkg/first', 'pkg/**', 'pkg/de/ep'].sort(byPathDepth), ['pkg/**', 'pkg/first', 'pkg/de/ep']);
});

test('Sort workspaces by path depth (reversed)', () => {
  assert.deepEqual(['first', 'sec/ond', 'th/i/rd'].sort(byPathDepth).reverse(), ['th/i/rd', 'sec/ond', 'first']);
  assert.deepEqual(['pkg/aaa', 'pkg/**', 'pkg/de/ep'].sort(byPathDepth).reverse(), ['pkg/de/ep', 'pkg/aaa', 'pkg/**']);
});
