import { z } from 'zod';
import { ConfigurationValidator, pluginSchema } from '../ConfigurationValidator.js';
import * as Plugins from '../plugins/index.js';
import type { SyncCompilers, AsyncCompilers } from './compilers.js';
import type { Rules } from './issues.js';

export type RawConfiguration = z.infer<typeof ConfigurationValidator>;

export type RawPluginConfiguration = z.infer<typeof pluginSchema>;

type NormalizedGlob = string[];

export type PluginName = keyof typeof Plugins;

export type PluginMap = typeof Plugins;

export type EnsuredPluginConfiguration = {
  config: NormalizedGlob | null;
  entry: NormalizedGlob | null;
  project: NormalizedGlob | null;
};

type PluginConfiguration = EnsuredPluginConfiguration | boolean;

export type PluginsConfiguration = Record<PluginName, PluginConfiguration>;

interface BaseWorkspaceConfiguration {
  entry: NormalizedGlob;
  project: NormalizedGlob;
  paths: Record<string, string[]>;
  ignore: NormalizedGlob;
  ignoreBinaries: string[];
  ignoreDependencies: string[];
}

export interface WorkspaceConfiguration extends BaseWorkspaceConfiguration, Partial<PluginsConfiguration> {}

type IgnorableExport = 'class' | 'enum' | 'function' | 'interface' | 'member' | 'type';

export interface Configuration {
  rules: Rules;
  include: string[];
  exclude: string[];
  ignore: NormalizedGlob;
  ignoreBinaries: string[];
  ignoreDependencies: string[];
  ignoreExportsUsedInFile: boolean | Partial<Record<IgnorableExport, boolean>>;
  ignoreWorkspaces: string[];
  syncCompilers: SyncCompilers;
  asyncCompilers: AsyncCompilers;
  defaultWorkspaceConfig: WorkspaceConfiguration;
  rootPluginConfigs: Partial<PluginsConfiguration>;
}
