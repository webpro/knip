import assert from 'node:assert/strict';
import test from 'node:test';
import { getDefinitelyTypedFor, getPackageFromDefinitelyTyped } from '../../src/util/modules.js';

test('Should return definitely typed package for package name', () => {
  assert.equal(getDefinitelyTypedFor('node'), '@types/node');
  assert.equal(getDefinitelyTypedFor('@npmcli/map-workspaces'), '@types/npmcli__map-workspaces');
  assert.equal(getDefinitelyTypedFor('@types/node'), '@types/node');
});

test('Should return package name from definitely typed package name', () => {
  assert.equal(getPackageFromDefinitelyTyped('node'), 'node');
  assert.equal(getPackageFromDefinitelyTyped('npmcli__map-workspaces'), '@npmcli/map-workspaces');
});
