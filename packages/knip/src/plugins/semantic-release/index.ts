import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { SemanticReleaseConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration-file

export const NAME = 'Semantic Release';

/** @public */
export const ENABLERS = ['semantic-release'];

export const PACKAGE_JSON_PATH = 'release';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.releaserc',
  '.releaserc.{yaml,yml,json,js,cjs}',
  'release.config.{js,cjs}',
  'package.json',
];

const findSemanticReleaseDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: SemanticReleaseConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest[PACKAGE_JSON_PATH]
    : await load(configFilePath);

  const plugins = (localConfig?.plugins ?? []).map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin));
  return plugins;
};

export const findDependencies = timerify(findSemanticReleaseDependencies);
