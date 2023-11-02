import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://tailwindcss.com/docs/configuration

export const NAME = 'Tailwind';

/** @public */
export const ENABLERS = ['tailwindcss'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['tailwind.config.{js,cjs,mjs,ts}'];
