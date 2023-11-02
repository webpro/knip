import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.astro.build/en/reference/configuration-reference/

export const NAME = 'Astro';

/** @public */
export const ENABLERS = ['astro'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

/** @public */
export const ENTRY_FILE_PATTERNS = ['astro.config.{js,cjs,mjs,ts}', 'src/content/config.ts'];

/** @public */
export const PRODUCTION_ENTRY_FILE_PATTERNS = ['src/pages/**/*.{astro,mdx,js,ts}', 'src/content/**/*.mdx'];

export const findDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  return config.entry
    ? config.entry.map(toProductionEntryPattern)
    : [...ENTRY_FILE_PATTERNS.map(toEntryPattern), ...PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern)];
};
