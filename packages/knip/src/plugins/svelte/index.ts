import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://kit.svelte.dev/docs

export const NAME = 'Svelte';

/** @public */
export const ENABLERS = ['svelte'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

/** @public */
export const ENTRY_FILE_PATTERNS = ['svelte.config.js', 'vite.config.ts'];

/** @public */
export const PRODUCTION_ENTRY_FILE_PATTERNS = [
  'src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
];

export const PROJECT_FILE_PATTERNS = ['src/**/*.{js,ts,svelte}'];

const findSvelteDependencies: GenericPluginCallback = async () => {
  return [...PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern), ...ENTRY_FILE_PATTERNS.map(toEntryPattern)];
};

export const findDependencies = timerify(findSvelteDependencies);
