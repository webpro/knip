import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toProductionEntryPattern } from '../../util/protocols.js';
import type { GatsbyActions, GatsbyConfig, GatsbyNode } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/gatsbyjs/gatsby/blob/master/docs/docs/reference/gatsby-project-structure.md
// https://github.com/gatsbyjs/gatsby/blob/master/docs/docs/reference/config-files/gatsby-config.md

export const NAME = 'Gatsby';

/** @public */
export const ENABLERS = ['gatsby', 'gatsby-cli'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['gatsby-{config,node}.{js,jsx,ts,tsx}', 'plugins/**/gatsby-node.{js,jsx,ts,tsx}'];

/** @public */
export const PRODUCTION_ENTRY_FILE_PATTERNS = [
  'gatsby-{browser,ssr}.{js,jsx,ts,tsx}',
  'src/api/**/*.{js,ts}',
  'src/pages/**/*.{js,jsx,ts,tsx}',
  'src/templates/**/*.{js,jsx,ts,tsx}',
  'src/html.{js,jsx,ts,tsx}',
  'plugins/**/gatsby-{browser,ssr}.{js,jsx,ts,tsx}',
];

const findGatsbyDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { isProduction, config } = options;

  const localConfig: GatsbyConfig | GatsbyNode | undefined = await load(configFilePath);

  const entryPatterns = (config.entry ?? PRODUCTION_ENTRY_FILE_PATTERNS).map(toProductionEntryPattern);

  if (isProduction || !localConfig) return entryPatterns;

  if (/gatsby-config/.test(configFilePath)) {
    return (localConfig as GatsbyConfig).plugins.map(plugin => (typeof plugin === 'string' ? plugin : plugin.resolve));
  }

  if (/gatsby-node/.test(configFilePath)) {
    const plugins = new Set<string>();
    const actions: GatsbyActions['actions'] = { setBabelPlugin: plugin => plugins.add(plugin.name) };
    const _config = localConfig as GatsbyNode;
    if (typeof _config.onCreateBabelConfig === 'function') {
      _config.onCreateBabelConfig({ actions });
    }
    return Array.from(plugins);
  }

  return [];
};

export const findDependencies = timerify(findGatsbyDependencies);
