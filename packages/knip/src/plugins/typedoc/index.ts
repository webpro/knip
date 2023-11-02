import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { TypeDocConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://typedoc.org/guides/overview/

export const NAME = 'TypeDoc';

/** @public */
export const ENABLERS = ['typedoc'];

export const PACKAGE_JSON_PATH = 'typedocOptions';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  'typedoc.{js,cjs,json,jsonc}',
  'typedoc.config.{js,cjs}',
  '.config/typedoc.{js,cjs,json,jsonc}',
  '.config/typedoc.config.{js,cjs}',
  'package.json',
  'tsconfig.json',
];

const findTypeDocDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: TypeDocConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest[PACKAGE_JSON_PATH]
    : configFilePath.endsWith('tsconfig.json')
    ? (await load(configFilePath)).typedocOptions
    : await load(configFilePath);

  return localConfig?.plugin ?? [];
};

export const findDependencies = timerify(findTypeDocDependencies);
