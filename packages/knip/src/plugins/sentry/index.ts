import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.sentry.io/platforms/javascript/configuration/

export const NAME = 'Sentry';

/** @public */
export const ENABLERS = [/^@sentry\//];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

/** @public */
export const ENTRY_FILE_PATTERNS = ['sentry.{client,server,edge}.config.{js,ts}'];

const findSentryDependencies: GenericPluginCallback = async () => {
  const entryPatterns = ENTRY_FILE_PATTERNS.map(toEntryPattern);
  return entryPatterns;
};

export const findDependencies = timerify(findSentryDependencies);
