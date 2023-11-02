import type { PluginMap } from './config.js';
import type { LiteralUnion, MergeUnion } from './util.js';

type Dependency = Record<string, string>;
type ExportCondition = LiteralUnion<
  'import' | 'require' | 'node' | 'node-addons' | 'deno' | 'browser' | 'electron' | 'react-native' | 'default',
  string
>;
type Exports = null | string | string[] | { [key in ExportCondition]: Exports } | { [key: string]: Exports };

type ExtractKeys<T, K extends string> = T extends { PACKAGE_JSON_PATH: infer P }
  ? P extends `${infer First}.${infer Second}`
    ? { [K1 in First]?: { [K2 in Second]?: unknown } }
    : { [P in T['PACKAGE_JSON_PATH'] & string]?: unknown }
  : Record<K, unknown>;

type PluginKeys = { [K in keyof PluginMap]: ExtractKeys<PluginMap[K], K> };
type Plugins = MergeUnion<PluginKeys[keyof PluginMap]>;

export type PackageJsonWithPlugins = {
  name?: string;
  main?: string;
  bin?: string | Record<string, string>;
  version?: string;
  workspaces?: string[] | { packages?: string[] };
  exports?: Exports;
  scripts?: Record<string, string>;
  dependencies?: Dependency;
  devDependencies?: Dependency;
  peerDependencies?: Dependency;
  optionalDependencies?: Dependency;
  peerDependenciesMeta?: Record<string, { optional: true }>;
} & Plugins;
