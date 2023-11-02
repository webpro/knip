import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import * as graphqlCodegen from '../../src/plugins/graphql-codegen/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/graphql-codegen');
const manifest = getManifest(cwd);

test('Find dependencies in graphql-codegen configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await graphqlCodegen.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, ['@graphql-codegen/client-preset']);
});

test('Find dependencies in graphql-codegen configuration (codegen.ts)', async () => {
  const configFilePath = join(cwd, 'codegen.ts');
  const dependencies = await graphqlCodegen.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, [
    '@graphql-codegen/near-operation-file-preset',
    '@graphql-codegen/schema-ast',
    '@graphql-codegen/introspection',
    '@graphql-codegen/typescript',
    '@graphql-codegen/typescript-operations',
    '@graphql-codegen/typescript-urql',
    '@graphql-codegen/typescript-operations',
    '@graphql-codegen/typescript-msw',
  ]);
});

test('Find dependencies in graphql-codegen configuration (codegen.ts function)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['codegen.ts']['@graphql-codegen/near-operation-file-preset']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/schema-ast']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/introspection']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript-urql']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript-msw']);
  assert(issues.unlisted['package.json']['@graphql-codegen/client-preset']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 8,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});
