import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { StrykerConfig } from './types.js';

// https://stryker-mutator.io/docs/stryker-js/config-file/

export const NAME = 'Stryker';

/** @public */
export const ENABLERS = ['@stryker-mutator/core'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['?(.)stryker.{conf,config}.{js,mjs,json}'];

const findStrykerDependencies: GenericPluginCallback = async configFilePath => {
  const config: StrykerConfig = await _load(configFilePath);
  if (config) {
    const runners = config.testRunner ? [`@stryker-mutator/${config.testRunner}-runner`] : [];
    const checkers = config.checkers ? config.checkers.map(checker => `@stryker-mutator/${checker}-checker`) : [];
    const plugins = config.plugins ?? [];
    return [...runners, ...checkers, ...plugins];
  }
  return [];
};

export const findDependencies = timerify(findStrykerDependencies);
