import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { NpmPkgJsonLintConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://npmpackagejsonlint.org/docs/

export const NAME = 'npm-package-json-lint';

/** @public */
export const ENABLERS = ['npm-package-json-lint'];

export const PACKAGE_JSON_PATH = 'npmpackagejsonlint';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.npmpackagejsonlintrc.json', 'npmpackagejsonlint.config.js', 'package.json'];

const findNpmPkgJsonLintConfigDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: NpmPkgJsonLintConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest[PACKAGE_JSON_PATH]
    : await load(configFilePath);

  return localConfig?.extends ? [localConfig.extends] : [];
};

export const findDependencies = timerify(findNpmPkgJsonLintConfigDependencies);
