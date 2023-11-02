import { join, isInternal, toAbsolute, dirname } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { JestConfig, JestInitialOptions } from './types.js';
import type {
  IsPluginEnabledCallback,
  GenericPluginCallback,
  GenericPluginCallbackOptions,
} from '../../types/plugins.js';

// https://jestjs.io/docs/configuration

export const NAME = 'Jest';

/** @public */
export const ENABLERS = ['jest'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies, manifest }) =>
  hasDependency(dependencies, ENABLERS) || Boolean(manifest.name?.startsWith('jest-presets'));

export const CONFIG_FILE_PATTERNS = ['jest.config.{js,ts,mjs,cjs,json}', 'package.json'];

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'];

const resolveExtensibleConfig = async (configFilePath: string) => {
  const config = await load(configFilePath);
  if (config?.preset) {
    const { preset } = config;
    if (isInternal(preset)) {
      const presetConfigPath = toAbsolute(preset, dirname(configFilePath));
      const presetConfig = await resolveExtensibleConfig(presetConfigPath);
      Object.assign(config, presetConfig);
    }
  }
  return config;
};

const resolveDependencies = (config: JestInitialOptions, options: GenericPluginCallbackOptions): string[] => {
  const { isProduction } = options;

  const entryPatterns = (options.config?.entry ?? config.testMatch ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);

  if (isProduction) return entryPatterns;

  const presets = (config.preset ? [config.preset] : []).map(preset =>
    isInternal(preset) ? preset : join(preset, 'jest-preset')
  );
  const projects = Array.isArray(config.projects)
    ? config.projects.map(config => (typeof config === 'string' ? config : resolveDependencies(config, options))).flat()
    : [];
  const runner = config.runner ? [config.runner] : [];
  const environments = config.testEnvironment === 'jsdom' ? ['jest-environment-jsdom'] : [];
  const resolvers = config.resolver ? [config.resolver] : [];
  const reporters = config.reporters
    ? config.reporters
        .map(reporter => (typeof reporter === 'string' ? reporter : reporter[0]))
        .filter(reporter => !['default', 'github-actions', 'summary'].includes(reporter))
    : [];
  const watchPlugins =
    config.watchPlugins?.map(watchPlugin => (typeof watchPlugin === 'string' ? watchPlugin : watchPlugin[0])) ?? [];
  const setupFiles = config.setupFiles ?? [];
  const setupFilesAfterEnv = config.setupFilesAfterEnv ?? [];
  const transform = config.transform
    ? Object.values(config.transform).map(transform => (typeof transform === 'string' ? transform : transform[0]))
    : [];
  const moduleNameMapper = (
    config.moduleNameMapper
      ? Object.values(config.moduleNameMapper).map(mapper => (typeof mapper === 'string' ? mapper : mapper[0]))
      : []
  ).filter(value => !/\$[0-9]/.test(value));
  const testResultsProcessor = config.testResultsProcessor ? [config.testResultsProcessor] : [];

  return [
    ...entryPatterns,
    ...presets,
    ...projects,
    ...runner,
    ...environments,
    ...resolvers,
    ...reporters,
    ...watchPlugins,
    ...setupFiles,
    ...setupFilesAfterEnv,
    ...transform,
    ...moduleNameMapper,
    ...testResultsProcessor,
  ];
};

const findJestDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, cwd } = options;

  let localConfig: JestConfig | undefined = configFilePath.endsWith('package.json')
    ? manifest.jest
    : await resolveExtensibleConfig(configFilePath);

  if (typeof localConfig === 'function') localConfig = await localConfig();

  // Normally we should bail out here, but to avoid duplication and keep it easy we carry on with fake local config
  if (!localConfig) localConfig = {};

  const rootDir = localConfig.rootDir ? join(dirname(configFilePath), localConfig.rootDir) : dirname(configFilePath);

  const replaceRootDir = (name: string) => (name.includes('<rootDir>') ? name.replace(/<rootDir>/, rootDir) : name);

  const dependencies = resolveDependencies(localConfig, options);

  const matchCwd = new RegExp('^' + toEntryPattern(cwd) + '/');
  return dependencies.map(replaceRootDir).map(dependency => dependency.replace(matchCwd, toEntryPattern('')));
};

export const findDependencies = timerify(findJestDependencies);
