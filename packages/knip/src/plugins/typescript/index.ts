import { compact } from '../../util/array.js';
import { dirname, isInternal, toAbsolute } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { loadTSConfig } from '../../util/tsconfig-loader.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { TsConfigJson } from 'type-fest';

// https://www.typescriptlang.org/tsconfig

export const NAME = 'TypeScript';

/** @public */
export const ENABLERS = ['typescript'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['tsconfig.json', 'tsconfig.*.json'];

const resolveExtensibleConfig = async (configFilePath: string) => {
  const localConfig: TsConfigJson | undefined = await load(configFilePath);

  if (!localConfig) return;

  localConfig.extends = localConfig.extends ? [localConfig.extends].flat() : [];
  if (localConfig?.extends) {
    for (const extend of [localConfig.extends].flat()) {
      if (isInternal(extend)) {
        const presetConfigPath = toAbsolute(extend, dirname(configFilePath));
        const presetConfig = await resolveExtensibleConfig(presetConfigPath);
        localConfig.extends.push(...(presetConfig?.extends ? [presetConfig.extends].flat() : []));
      }
    }
  }
  return localConfig;
};

export const findTypeScriptDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { isProduction } = options;

  const { compilerOptions } = await loadTSConfig(configFilePath);
  const localConfig: TsConfigJson | undefined = await resolveExtensibleConfig(configFilePath); // Dual loader to get external `extends` dependencies

  if (!compilerOptions || !localConfig) return [];

  const jsx = compilerOptions?.jsxImportSource ? [compilerOptions.jsxImportSource] : [];

  if (isProduction) return [...jsx];

  const extend = localConfig.extends ? [localConfig.extends].flat().filter(extend => !isInternal(extend)) : [];
  const types = compilerOptions.types ?? [];
  const plugins = Array.isArray(compilerOptions?.plugins)
    ? compilerOptions.plugins.map(plugin => (typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''))
    : [];
  const importHelpers = compilerOptions?.importHelpers ? ['tslib'] : [];

  return compact([...extend, ...types, ...plugins, ...importHelpers, ...jsx]);
};

export const findDependencies = timerify(findTypeScriptDependencies);
