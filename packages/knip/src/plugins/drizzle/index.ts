import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toProductionEntryPattern } from '../../util/protocols.js';
import type { DrizzleConfig } from './types.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://orm.drizzle.team/kit-docs/overview

export const NAME = 'Drizzle';

/** @public */
export const ENABLERS = ['drizzle-kit'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['drizzle.config.{ts,js,json}'];

const findDrizzleDependencies: GenericPluginCallback = async configFilePath => {
  const localConfig: DrizzleConfig | undefined = await load(configFilePath);

  if (!localConfig?.schema) return [];

  return [localConfig.schema].flat().map(toProductionEntryPattern);
};

export const findDependencies = timerify(findDrizzleDependencies);
