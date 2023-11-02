import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://remix.run/docs/en/v1/api/conventions

export const NAME = 'Remix';

/** @public */
export const ENABLERS = [/^@remix-run\//];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

/** @public */
export const ENTRY_FILE_PATTERNS = ['remix.config.js', 'remix.init/index.js'];

/** @public */
export const PRODUCTION_ENTRY_FILE_PATTERNS = [
  'app/root.tsx',
  'app/entry.{client,server}.{js,jsx,ts,tsx}',
  'app/routes/**/*.{js,ts,tsx}',
  'server.{js,ts}',
];

const findRemixDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  return config.entry
    ? config.entry.map(toProductionEntryPattern)
    : [...ENTRY_FILE_PATTERNS.map(toEntryPattern), ...PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern)];
};

export const findDependencies = timerify(findRemixDependencies);
