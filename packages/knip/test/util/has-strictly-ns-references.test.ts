import { test } from 'bun:test';
import assert from 'node:assert/strict';
import type { SerializableImports } from '../../src/types/imports.js';
import { getHasStrictlyNsReferences } from '../../src/util/type.js';

const base: SerializableImports = {
  specifier: '',
  isReExport: false,
  reExportedBy: new Set(),
  reExportedAs: new Set(),
  reExportedNs: new Set(),
  importedNs: new Set(),
  refs: new Set(),
};

test('Strictly namespace refs (no namespaces)', () => {
  assert.deepStrictEqual(getHasStrictlyNsReferences(base), [false]);
});

test('Strictly namespace refs (single ns)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      importedNs: new Set(['ns']),
      refs: new Set(['ns']),
    }),
    [true, 'ns']
  );
});

test('Strictly namespace refs (no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      importedNs: new Set(['ns']),
      refs: new Set([]),
    }),
    [false, 'ns']
  );
});

test('Strictly namespace refs (single ns, no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      hasStar: true,
      importedNs: new Set([]),
      refs: new Set(['ns']),
    }),
    [false]
  );
});

test('Strictly namespace refs (multiple ns, no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      importedNs: new Set(['ns', 'ns2']),
      refs: new Set(['ns']),
    }),
    [false, 'ns2']
  );
});

test('Strictly namespace refs (member access)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      importedNs: new Set(['ns']),
      refs: new Set(['ns', 'ns.prop']),
    }),
    [false, 'ns']
  );
});
