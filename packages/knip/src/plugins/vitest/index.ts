import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import { getEnvPackageName, getExternalReporters } from './helpers.js';
import type { ViteConfigOrFn, VitestWorkspaceConfig, ViteConfig, MODE, COMMAND } from './types.js';
import type {
  IsPluginEnabledCallback,
  GenericPluginCallback,
  GenericPluginCallbackOptions,
} from '../../types/plugins.js';

// https://vitest.dev/config/

export const NAME = 'Vitest';

/** @public */
export const ENABLERS = ['vitest'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['vitest.config.ts', 'vitest.{workspace,projects}.{ts,js,json}'];

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/*.{test,spec}.?(c|m)[jt]s?(x)'];

const findConfigDependencies = (localConfig: ViteConfig, options: GenericPluginCallbackOptions) => {
  const { isProduction, config } = options;
  const testConfig = localConfig.test;

  const entryPatterns = (config?.entry ?? testConfig?.include ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);

  if (!testConfig || isProduction) return entryPatterns;

  const environments = testConfig.environment ? [getEnvPackageName(testConfig.environment)] : [];
  const reporters = getExternalReporters(testConfig.reporters);
  const coverage = testConfig.coverage ? [`@vitest/coverage-${testConfig.coverage.provider ?? 'v8'}`] : [];
  const setupFiles = testConfig.setupFiles ? [testConfig.setupFiles].flat() : [];
  const globalSetup = testConfig.globalSetup ? [testConfig.globalSetup].flat() : [];
  return [...entryPatterns, ...environments, ...reporters, ...coverage, ...setupFiles, ...globalSetup];
};

export const findVitestDependencies = async (localConfig: ViteConfigOrFn, options: GenericPluginCallbackOptions) => {
  if (!localConfig) return [];

  if (typeof localConfig === 'function') {
    const dependencies = new Set<string>();
    for (const command of ['dev', 'serve', 'build'] as COMMAND[]) {
      for (const mode of ['development', 'production'] as MODE[]) {
        const config = await localConfig({ command, mode, ssrBuild: undefined });
        findConfigDependencies(config, options).forEach(dependency => dependencies.add(dependency));
      }
    }
    return Array.from(dependencies);
  }

  if (!localConfig.test) return [];

  return findConfigDependencies(localConfig, options);
};

const findVitestWorkspaceDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const localConfig: ViteConfigOrFn | VitestWorkspaceConfig | undefined = await load(configFilePath);

  const dependencies = new Set<string>();
  for (const config of [localConfig].flat()) {
    if (config && typeof config !== 'string') {
      (await findVitestDependencies(config, options)).forEach(dependency => dependencies.add(dependency));
    }
  }
  return Array.from(dependencies);
};

export const findDependencies = timerify(findVitestWorkspaceDependencies);
