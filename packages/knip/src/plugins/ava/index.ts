import { _getDependenciesFromScripts } from '../../binaries/index.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { AvaConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/avajs/ava/blob/main/docs/06-configuration.md

export const NAME = 'Ava';

/** @public */
export const ENABLERS = ['ava'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['ava.config.{js,cjs,mjs}', 'package.json'];

/** @public */
export const ENTRY_FILE_PATTERNS = [
  `test.{js,cjs,mjs,ts}`,
  `{src,source}/test.{js,cjs,mjs,ts}`,
  `**/__tests__/**/*.{js,cjs,mjs,ts}`,
  `**/*.spec.{js,cjs,mjs,ts}`,
  `**/*.test.{js,cjs,mjs,ts}`,
  `**/test-*.{js,cjs,mjs,ts}`,
  `**/test/**/*.{js,cjs,mjs,ts}`,
  `**/tests/**/*.{js,cjs,mjs,ts}`,
  '!**/__tests__/**/__{helper,fixture}?(s)__/**/*',
  '!**/test?(s)/**/{helper,fixture}?(s)/**/*',
];

const findAvaDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { cwd, manifest, isProduction, config } = options;

  let localConfig: AvaConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest.ava
    : await load(configFilePath);

  if (typeof localConfig === 'function') localConfig = localConfig();

  const entryPatterns = (config.entry ?? localConfig?.files ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);

  if (isProduction || !localConfig) return entryPatterns;

  const nodeArgs = localConfig.nodeArguments ?? [];
  const requireArgs = (localConfig.require ?? []).map(require => `--require ${require}`);
  const fakeCommand = `node ${nodeArgs.join(' ')} ${requireArgs.join(' ')}`;

  const dependencies = _getDependenciesFromScripts([fakeCommand], {
    cwd,
    manifest,
    knownGlobalsOnly: true,
  });

  return [...entryPatterns, ...dependencies];
};

export const findDependencies = timerify(findAvaDependencies);
