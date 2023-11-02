import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { findVitestDependencies } from '../vitest/index.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { ViteConfigOrFn } from '../vitest/types.js';

// https://vitejs.dev/config/

export const NAME = 'Vite';

/** @public */
export const ENABLERS = ['vite'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['vite.config.{js,ts}'];

const findViteDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const localConfig: ViteConfigOrFn | undefined = await load(configFilePath);

  if (!localConfig) return [];

  return findVitestDependencies(localConfig, options);
};

export const findDependencies = timerify(findViteDependencies);
