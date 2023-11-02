import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { StrykerConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://stryker-mutator.io/docs/stryker-js/config-file/

export const NAME = 'Stryker';

/** @public */
export const ENABLERS = ['@stryker-mutator/core'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['?(.)stryker.{conf,config}.{js,mjs,cjs,json}'];

const findStrykerDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { isProduction } = options;

  if (isProduction) return [];

  const localConfig: StrykerConfig | undefined = await load(configFilePath);

  if (!localConfig) return [];

  const runners = localConfig.testRunner ? [`@stryker-mutator/${localConfig.testRunner}-runner`] : [];
  const checkers = localConfig.checkers
    ? localConfig.checkers.map(checker => `@stryker-mutator/${checker}-checker`)
    : [];
  const plugins = localConfig.plugins ?? [];

  return [...runners, ...checkers, ...plugins];
};

export const findDependencies = timerify(findStrykerDependencies);
