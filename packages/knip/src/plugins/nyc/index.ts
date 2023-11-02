import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { NycConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://www.npmjs.com/package/nyc

export const NAME = 'nyc';

/** @public */
export const ENABLERS = ['nyc'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.nycrc', '.nycrc.json', '.nycrc.{yml,yaml}', 'nyc.config.js'];

const findNycDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { isProduction } = options;

  if (isProduction) return [];

  const localConfig: NycConfig | undefined = await load(configFilePath);

  return localConfig?.extends ? [localConfig.extends].flat() : [];
};

export const findDependencies = timerify(findNycDependencies);
