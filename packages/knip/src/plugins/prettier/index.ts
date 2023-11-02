import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PrettierConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://prettier.io/docs/en/configuration.html

export const NAME = 'Prettier';

/** @public */
export const ENABLERS = ['prettier'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies, config }) =>
  hasDependency(dependencies, ENABLERS) || 'prettier' in config;

export const CONFIG_FILE_PATTERNS = [
  '.prettierrc',
  '.prettierrc.{json,js,cjs,mjs,yml,yaml}',
  'prettier.config.{js,cjs,mjs}',
  'package.json',
];

const findPrettierDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  if (isProduction) return [];

  const localConfig: PrettierConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest.prettier
    : await load(configFilePath);

  return localConfig && Array.isArray(localConfig.plugins)
    ? localConfig.plugins.filter((plugin): plugin is string => typeof plugin === 'string')
    : [];
};

export const findDependencies = timerify(findPrettierDependencies);
