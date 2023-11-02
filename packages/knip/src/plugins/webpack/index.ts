import { compact } from '../../util/array.js';
import { join, relative } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { WebpackConfig, Env, Argv } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { BabelConfigObj } from '../babel/types.js';
import type { RuleSetRule, RuleSetUseItem } from 'webpack';

// https://webpack.js.org/configuration/

export const NAME = 'Webpack';

/** @public */
export const ENABLERS = ['webpack'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['webpack.config*.{js,ts}'];

const hasBabelOptions = (use: RuleSetUseItem) =>
  Boolean(use) &&
  typeof use !== 'string' &&
  'loader' in use &&
  typeof use.loader === 'string' &&
  use.loader === 'babel-loader' &&
  typeof use.options === 'object';

const info = { compiler: '', issuer: '', realResource: '', resource: '', resourceQuery: '' };

const resolveRuleSetDependencies = (rule: RuleSetRule | undefined | null | false | 0 | '...' | '') => {
  if (!rule || typeof rule === 'string') return [];
  if (typeof rule.use === 'string') return [rule.use];
  let useItem = rule.use ?? rule.loader ?? rule;
  if (typeof useItem === 'function') useItem = useItem(info);
  return [useItem].flat().flatMap((useItem: RuleSetUseItem | undefined | null | false | 0) => {
    if (!useItem) return [];
    if (hasBabelOptions(useItem)) {
      return [
        ...resolveUseItem(useItem),
        ...getDependenciesFromConfig((useItem as { options: BabelConfigObj }).options),
      ];
    }
    return resolveUseItem(useItem);
  });
};

const resolveUseItem = (use: RuleSetUseItem) => {
  if (!use) return [];
  if (typeof use === 'string') return [use];
  if ('loader' in use && typeof use.loader === 'string') return [use.loader];
  return [];
};

const findWebpackDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction, cwd } = options;

  const localConfig: WebpackConfig | undefined = await load(configFilePath);

  if (!localConfig) return [];

  // Projects may use a single config function for both development and production modes, so resolve it twice
  // https://webpack.js.org/configuration/configuration-types/#exporting-a-function
  const passes = typeof localConfig === 'function' ? [false, true] : [false];

  const dependencies = new Set<string>();
  const entryPatterns = new Set<string>();

  for (const isProduction of passes) {
    const env: Env = { production: isProduction };
    const argv: Argv = { mode: isProduction ? 'production' : 'development' };
    const resolvedConfig = typeof localConfig === 'function' ? await localConfig(env, argv) : localConfig;

    for (const options of [resolvedConfig].flat()) {
      const entries = [];

      for (const loader of options.module?.rules?.flatMap(resolveRuleSetDependencies) ?? []) {
        dependencies.add(loader.replace(/\?.*/, ''));
      }

      if (typeof options.entry === 'string') entries.push(options.entry);
      else if (Array.isArray(options.entry)) entries.push(...options.entry);
      else if (typeof options.entry === 'object') {
        Object.values(options.entry).map(entry => {
          if (typeof entry === 'string') entries.push(entry);
          else if (Array.isArray(entry)) entries.push(...entry);
          else if (typeof entry === 'function') entries.push((entry as () => string)());
          else if (entry && typeof entry === 'object' && 'filename' in entry) entries.push(entry['filename'] as string);
        });
      }

      entries.forEach(entry => {
        const item = relative(cwd, join(options.context ? options.context : cwd, entry));
        const value = options.mode === 'development' ? toEntryPattern(item) : toProductionEntryPattern(item);
        entryPatterns.add(value);
      });
    }
  }

  if (isProduction) return [...entryPatterns];

  const scripts = Object.values(manifest.scripts ?? {});
  const webpackCLI = scripts.some(script => script?.includes('webpack ')) ? ['webpack-cli'] : [];
  const webpackDevServer = scripts.some(script => script?.includes('webpack serve')) ? ['webpack-dev-server'] : [];

  return compact([...entryPatterns, ...dependencies, ...webpackCLI, ...webpackDevServer]);
};

export const findDependencies = timerify(findWebpackDependencies);
