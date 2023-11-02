import { assert, expect, test } from 'vitest';

test('Math.sqrt()', () => {
  expect(Math.sqrt(4)).toBe(2);
});

test('JSON', () => {
  const input = {};
  assert.deepEqual(JSON.parse(JSON.stringify(input)), input, 'matches original');
});
