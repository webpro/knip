import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { MochaConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://mochajs.org/#configuring-mocha-nodejs

export const NAME = 'Mocha';

/** @public */
export const ENABLERS = ['mocha'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/test/*.{js,cjs,mjs}'];

const findMochaDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config, manifest, isProduction } = options;

  const localConfig: MochaConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest.mocha
    : await load(configFilePath);

  const entryPatterns = (config.entry ?? (localConfig?.spec ? [localConfig.spec].flat() : ENTRY_FILE_PATTERNS)).map(
    toEntryPattern
  );

  if (isProduction || !localConfig) return entryPatterns;

  const require = localConfig.require ? [localConfig.require].flat() : [];

  return [...require, ...entryPatterns];
};

export const findDependencies = timerify(findMochaDependencies);
