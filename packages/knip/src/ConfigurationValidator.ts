import { z } from 'zod';

const globSchema = z.union([z.string(), z.array(z.string())]);

const pathsSchema = z.record(z.string(), z.array(z.string()));

const syncCompilerSchema = z.function().args(z.string()).returns(z.string());
const asyncCompilerSchema = z.function().args(z.string()).returns(z.promise(z.string()));
const compilerSchema = z.union([syncCompilerSchema, asyncCompilerSchema]);
const compilersSchema = z.record(z.string(), compilerSchema);

const issueTypeSchema = z.union([
  z.literal('files'),
  z.literal('dependencies'),
  z.literal('devDependencies'),
  z.literal('unlisted'),
  z.literal('binaries'),
  z.literal('unresolved'),
  z.literal('exports'),
  z.literal('types'),
  z.literal('nsExports'),
  z.literal('nsTypes'),
  z.literal('duplicates'),
  z.literal('enumMembers'),
  z.literal('classMembers'),
]);

const rulesSchema = z.record(issueTypeSchema, z.enum(['error', 'warn', 'off']));

const ignoreExportsUsedInFileSchema = z.union([
  z.boolean(),
  z.record(
    z.union([
      z.literal('class'),
      z.literal('enum'),
      z.literal('function'),
      z.literal('interface'),
      z.literal('member'),
      z.literal('type'),
    ]),
    z.boolean()
  ),
]);

const rootConfigurationSchema = z.object({
  rules: rulesSchema.optional(),
  entry: globSchema.optional(),
  project: globSchema.optional(),
  paths: pathsSchema.optional(),
  ignore: globSchema.optional(),
  ignoreBinaries: z.array(z.string()).optional(),
  ignoreExportsUsedInFile: ignoreExportsUsedInFileSchema.optional(),
  ignoreDependencies: z.array(z.string()).optional(),
  ignoreWorkspaces: z.array(z.string()).optional(),
  compilers: compilersSchema.optional(),
  syncCompilers: z.record(z.string(), syncCompilerSchema).optional(),
  asyncCompilers: z.record(z.string(), asyncCompilerSchema).optional(),
});

const reportConfigSchema = z.object({
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});

export const pluginSchema = z.union([
  z.boolean(),
  globSchema,
  z.object({
    config: globSchema.optional(),
    entry: globSchema.optional(),
    project: globSchema.optional(),
  }),
]);

const pluginsSchema = z.object({
  astro: pluginSchema,
  angular: pluginSchema,
  ava: pluginSchema,
  babel: pluginSchema,
  capacitor: pluginSchema,
  changesets: pluginSchema,
  commitizen: pluginSchema,
  commitlint: pluginSchema,
  cspell: pluginSchema,
  cypress: pluginSchema,
  eslint: pluginSchema,
  gatsby: pluginSchema,
  'github-actions': pluginSchema,
  'graphql-codegen': pluginSchema,
  husky: pluginSchema,
  jest: pluginSchema,
  lefthook: pluginSchema,
  'lint-staged': pluginSchema,
  markdownlint: pluginSchema,
  mocha: pluginSchema,
  next: pluginSchema,
  'node-test-runner': pluginSchema,
  'npm-package-json-lint': pluginSchema,
  nx: pluginSchema,
  nyc: pluginSchema,
  playwright: pluginSchema,
  postcss: pluginSchema,
  prettier: pluginSchema,
  'release-it': pluginSchema,
  remark: pluginSchema,
  remix: pluginSchema,
  rollup: pluginSchema,
  'semantic-release': pluginSchema,
  sentry: pluginSchema,
  storybook: pluginSchema,
  stryker: pluginSchema,
  stylelint: pluginSchema,
  tailwind: pluginSchema,
  typedoc: pluginSchema,
  typescript: pluginSchema,
  vite: pluginSchema,
  vitest: pluginSchema,
  webpack: pluginSchema,
});

const baseWorkspaceConfigurationSchema = z.object({
  entry: globSchema.optional(),
  project: globSchema.optional(),
  paths: pathsSchema.optional(),
  ignore: globSchema.optional(),
  ignoreBinaries: z.array(z.string()).optional(),
  ignoreDependencies: z.array(z.string()).optional(),
});

const workspaceConfigurationSchema = baseWorkspaceConfigurationSchema.merge(pluginsSchema.partial());

const workspacesConfigurationSchema = z.object({
  workspaces: z.record(z.string(), workspaceConfigurationSchema).optional(),
});

export const ConfigurationValidator = rootConfigurationSchema
  .merge(reportConfigSchema)
  .merge(workspacesConfigurationSchema)
  .merge(pluginsSchema.partial());
