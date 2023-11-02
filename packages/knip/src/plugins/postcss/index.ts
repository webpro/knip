import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PostCSSConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

export const NAME = 'PostCSS';

/** @public */
export const ENABLERS = ['postcss', 'next'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['postcss.config.{cjs,js}', 'postcss.config.json', 'package.json'];

const findPostCSSDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: PostCSSConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest?.postcss
    : await load(configFilePath);

  if (!localConfig) return [];

  return localConfig.plugins
    ? (Array.isArray(localConfig.plugins) ? localConfig.plugins : Object.keys(localConfig.plugins)).flatMap(plugin => {
        if (typeof plugin === 'string') return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
        return [];
      })
    : [];
};

export const findDependencies = timerify(findPostCSSDependencies);
