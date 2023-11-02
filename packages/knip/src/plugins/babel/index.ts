import { compact } from '../../util/array.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { resolvePresetName, resolvePluginName, api } from './helpers.js';
import type { BabelConfig, BabelConfigObj } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://babeljs.io/docs/en/configuration

export const NAME = 'Babel';

/** @public */
export const ENABLERS = [/^@babel\//];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  'babel.config.json',
  'babel.config.js',
  '.babelrc.json',
  '.babelrc.js',
  '.babelrc',
  'package.json',
];

const getItemName = (value: string | [string, unknown]) =>
  typeof value === 'string' ? [value] : Array.isArray(value) ? [value[0]] : [];

export const getDependenciesFromConfig = (config: BabelConfigObj): string[] => {
  const presets = config.presets?.flatMap(getItemName).map(resolvePresetName) ?? [];
  const plugins = config.plugins?.flatMap(getItemName).map(resolvePluginName) ?? [];
  const nested = config.env ? Object.values(config.env).flatMap(getDependenciesFromConfig) : [];
  return compact([...presets, ...plugins, ...nested]);
};

const findBabelDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  if (isProduction) return [];

  let localConfig: BabelConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest.babel
    : await load(configFilePath);

  if (typeof localConfig === 'function') localConfig = localConfig(api);

  if (!localConfig) return [];

  return getDependenciesFromConfig(localConfig);
};

export const findDependencies = timerify(findBabelDependencies);
