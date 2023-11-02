import { isInternal } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://stylelint.io/user-guide/configure/

export const NAME = 'Stylelint';

/** @public */
export const ENABLERS = ['stylelint'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.stylelintrc',
  '.stylelintrc.{cjs,js,json,yaml,yml}',
  'stylelint.config.{cjs,mjs,js}',
];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: PluginConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest.stylelint
    : await load(configFilePath);

  if (!localConfig) return [];

  const extend = localConfig.extends ? [localConfig.extends].flat().filter(extend => !isInternal(extend)) : [];
  const plugins = localConfig.plugins ? [localConfig.plugins].flat().filter(plugin => !isInternal(plugin)) : [];

  return [...extend, ...plugins];
};

export const findDependencies = timerify(findPluginDependencies);
