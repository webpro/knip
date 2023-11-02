import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://commitlint.js.org
// https://github.com/conventional-changelog/commitlint#config

type CommitLintConfig = {
  extends: string[];
};

export const NAME = 'commitlint';

/** @public */
export const ENABLERS = ['@commitlint/cli'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.commitlintrc',
  '.commitlintrc.{json,yaml,yml,js,cjs,ts,cts}',
  'commitlint.config.{js,cjs,ts,cts}',
  'package.json',
];

const findCommitLintDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  if (isProduction) return [];

  const localConfig: CommitLintConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest.commitlint
    : await load(configFilePath);

  if (!localConfig) return [];

  return localConfig.extends ? [localConfig.extends].flat() : [];
};

export const findDependencies = timerify(findCommitLintDependencies);
