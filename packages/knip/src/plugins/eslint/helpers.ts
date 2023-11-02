import { compact } from '../../util/array.js';
import { isInternal, dirname, toAbsolute } from '../../util/path.js';
import { load } from '../../util/plugin.js';
import { _resolve } from '../../util/require.js';
import { fallback } from './fallback.js';
import { PACKAGE_JSON_PATH } from './index.js';
import type { ESLintConfig, OverrideConfig } from './types.js';
import type { PackageJsonWithPlugins } from '../../types/package-json.js';

const getDependencies = (config: ESLintConfig | OverrideConfig) => {
  const extendsSpecifiers = config.extends ? [config.extends].flat().map(resolveExtendSpecifier) : [];
  // https://github.com/prettier/eslint-plugin-prettier#recommended-configuration
  if (extendsSpecifiers.some(specifier => specifier?.startsWith('eslint-plugin-prettier')))
    extendsSpecifiers.push('eslint-config-prettier');

  const plugins = config.plugins ? config.plugins.map(resolvePluginSpecifier) : [];
  const parser = config.parser;
  const extraPlugins = config.parserOptions?.babelOptions?.plugins ?? [];
  const extraParsers = config.parserOptions?.babelOptions?.presets ?? [];
  const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
  const overrides: string[] = config.overrides ? [config.overrides].flat().flatMap(getDependencies) : [];

  return compact([
    ...extendsSpecifiers,
    ...plugins,
    ...extraPlugins,
    parser,
    ...extraParsers,
    ...settings,
    ...overrides,
  ]);
};

type GetDependenciesDeep = (
  configFilePath: string,
  options: { cwd: string; manifest: PackageJsonWithPlugins },
  dependencies?: Set<string>
) => Promise<Set<string>>;

export const getDependenciesDeep: GetDependenciesDeep = async (configFilePath, options, dependencies = new Set()) => {
  const addAll = (deps: string[] | Set<string>) => deps.forEach(dependency => dependencies.add(dependency));

  const localConfig: ESLintConfig | undefined = configFilePath.endsWith('package.json')
    ? options.manifest[PACKAGE_JSON_PATH]
    : /(\.(jsonc?|ya?ml)|rc)$/.test(configFilePath)
    ? await load(configFilePath)
    : await fallback(configFilePath);

  if (localConfig) {
    if (localConfig.extends) {
      for (const extend of [localConfig.extends].flat()) {
        if (isInternal(extend)) {
          const filePath = toAbsolute(extend, dirname(configFilePath));
          const extendConfigFilePath = _resolve(filePath);
          dependencies.add(extendConfigFilePath);
          addAll(await getDependenciesDeep(extendConfigFilePath, options, dependencies));
        }
      }
    }

    addAll(getDependencies(localConfig));
  }

  return dependencies;
};

const isQualifiedSpecifier = (specifier: string) =>
  specifier === 'eslint' ||
  /\/eslint-(config|plugin)$/.test(specifier) ||
  /.+eslint-(config|plugin)\//.test(specifier) ||
  /eslint-(config|plugin)-/.test(specifier);

const resolveSpecifier = (namespace: 'eslint-plugin' | 'eslint-config', rawSpecifier: string) => {
  const specifier = rawSpecifier.replace(/(^plugin:|:.+$)/, '');
  if (isQualifiedSpecifier(specifier)) return specifier;
  if (!specifier.startsWith('@')) return `${namespace}-${specifier}`;
  const [scope, name, ...rest] = specifier.split('/');
  if (rawSpecifier.startsWith('plugin:') && rest.length === 0) return [scope, namespace, name].join('/');
  return [scope, name ? `${namespace}-${name}` : namespace, ...rest].join('/');
};

/** @internal */
export const resolvePluginSpecifier = (specifier: string) => resolveSpecifier('eslint-plugin', specifier);

/** @internal */
export const resolveExtendSpecifier = (specifier: string) => {
  if (isInternal(specifier)) return;

  // Exception: eslint-config-next → next
  if (/^next(\/.+)?$/.test(specifier)) return specifier;

  const namespace = specifier.startsWith('plugin:') ? 'eslint-plugin' : 'eslint-config';
  return resolveSpecifier(namespace, specifier);
};

// Super custom: find dependencies of specific ESLint plugins through settings
const getDependenciesFromSettings = (settings: ESLintConfig['settings'] = {}) => {
  return compact(
    Object.entries(settings).flatMap(([settingKey, settings]) => {
      if (settingKey === 'import/resolver') {
        return (typeof settings === 'string' ? [settings] : Object.keys(settings))
          .filter(key => key !== 'node')
          .map(key => `eslint-import-resolver-${key}`);
      }
      if (settingKey === 'import/parsers') {
        return typeof settings === 'string' ? [settings] : Object.keys(settings);
      }
    })
  );
};
