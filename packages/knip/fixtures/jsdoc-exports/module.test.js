import test from 'node:test';

import { publicFn, internalFn } from './module';

test('public fn', () => {
  publicFn();
});

test('internal fn', () => {
  internalFn();
});
