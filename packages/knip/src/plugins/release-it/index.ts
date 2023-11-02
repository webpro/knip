import { _getDependenciesFromScripts } from '../../binaries/index.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { ReleaseItConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/release-it/release-it/blob/master/docs/plugins.md#using-a-plugin

export const NAME = 'Release It';

/** @public */
export const ENABLERS = ['release-it'];

export const PACKAGE_JSON_PATH = 'release-it';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.release-it.json',
  '.release-it.{js,cjs}',
  '.release-it.{yml,yaml}',
  'package.json',
];

const findReleaseItDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { cwd, manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: ReleaseItConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest[PACKAGE_JSON_PATH]
    : await load(configFilePath);

  if (!localConfig) return [];

  const plugins = localConfig.plugins ? Object.keys(localConfig.plugins) : [];
  const scripts = localConfig.hooks ? Object.values(localConfig.hooks).flat() : [];
  if (typeof localConfig.github?.releaseNotes === 'string') {
    scripts.push(localConfig.github.releaseNotes);
  }
  if (typeof localConfig.gitlab?.releaseNotes === 'string') {
    scripts.push(localConfig.gitlab.releaseNotes);
  }
  const dependencies = _getDependenciesFromScripts(scripts, { cwd, manifest });

  return [...plugins, ...dependencies];
};

export const findDependencies = timerify(findReleaseItDependencies);
