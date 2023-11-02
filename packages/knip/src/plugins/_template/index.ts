import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// link to docs

export const NAME = '';

/** @public */
export const ENABLERS = [''];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [];

/** @public */
export const ENTRY_FILE_PATTERNS = [];

/** @public */
export const PRODUCTION_ENTRY_FILE_PATTERNS = [];

export const PROJECT_FILE_PATTERNS = [];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, config, isProduction } = options;

  // load configuration file from `configFilePath` (or grab `manifest` for package.json)
  // load(FAKE_PATH) will return `undefined`
  const localConfig: PluginConfig | undefined = configFilePath.endsWith('package.json')
    ? // @ts-expect-error `plugin` is not an actual plugin name
      manifest.plugin
    : await load(configFilePath);

  if (!localConfig) return [];

  // if plugin handles entry files, order of precedence (use only the first one that's set):
  // 1. config.entry
  // 2. entry patterns from `cfg`
  // 3. ENTRY_FILE_PATTERNS
  const entryPatterns = (config?.entry ?? localConfig.entryPathsOrPatterns ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);

  // if PRODUCTION_ENTRY_FILE_PATTERNS is set, only return them if `config.entry` is not set
  const productionPatterns = config.entry ? [] : PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern);

  // in production mode:
  // - plugins that don't deal with (production) entry files can bail out at the start of the function
  // - plugins that only deal with `devDependencies` can bail out here and return all entry patterns
  // - local config may include production dependencies (e.g. entry paths) and devDependencies (e.g. build tooling),
  //   requiring more fine-grained logic based on `isProduction`
  if (isProduction) return [...entryPatterns, ...productionPatterns];

  // resolve dependencies/binaries from local config file
  const dependencies = localConfig?.plugins ?? [];

  return [...dependencies, ...entryPatterns, ...productionPatterns];
};

export const findDependencies = timerify(findPluginDependencies);
