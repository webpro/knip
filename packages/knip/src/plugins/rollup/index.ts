import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://rollupjs.org/guide/en/#configuration-files

export const NAME = 'Rollup';

/** @public */
export const ENABLERS = ['rollup'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

/** @public */
export const ENTRY_FILE_PATTERNS = ['rollup.config.{js,cjs,mjs,ts}'];

const findRollupDependencies: GenericPluginCallback = async () => {
  const entryPatterns = ENTRY_FILE_PATTERNS.map(toEntryPattern);
  return entryPatterns;
};

export const findDependencies = timerify(findRollupDependencies);
