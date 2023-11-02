import type { EnsuredPluginConfiguration, WorkspaceConfiguration } from './config.js';
import type { PackageJsonWithPlugins } from './package-json.js';

type IsPluginEnabledCallbackOptions = {
  cwd: string;
  manifest: PackageJsonWithPlugins;
  dependencies: Set<string>;
  config: WorkspaceConfiguration;
};

export type IsPluginEnabledCallback = (options: IsPluginEnabledCallbackOptions) => boolean | Promise<boolean>;

export type GenericPluginCallbackOptions = {
  cwd: string;
  manifest: PackageJsonWithPlugins;
  config: EnsuredPluginConfiguration;
  isProduction: boolean;
};

export type GenericPluginCallback = (
  configFilePath: string,
  options: GenericPluginCallbackOptions
) => Promise<string[]> | string[];
