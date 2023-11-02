export { _load as load, _loadFile as loadFile } from './loader.js';
import { arrayify } from './array.js';
import type { RawPluginConfiguration } from '../types/config.js';

export const toCamelCase = (name: string) =>
  name.toLowerCase().replace(/(-[a-z])/g, group => group.toUpperCase().replace('-', ''));

export const hasDependency = (dependencies: Set<string>, values: (string | RegExp)[]) =>
  values.some(value => {
    if (typeof value === 'string') {
      return dependencies.has(value);
    } else if (value instanceof RegExp) {
      for (const dependency of dependencies) {
        if (value.test(dependency)) return true;
      }
    }
    return false;
  });

export const normalizePluginConfig = (pluginConfig: RawPluginConfiguration) => {
  if (typeof pluginConfig === 'boolean') {
    return pluginConfig;
  } else {
    const isObject = typeof pluginConfig !== 'string' && !Array.isArray(pluginConfig);
    const config = isObject
      ? 'config' in pluginConfig
        ? arrayify(pluginConfig.config)
        : null
      : pluginConfig
      ? arrayify(pluginConfig)
      : null;
    const entry = isObject && 'entry' in pluginConfig ? arrayify(pluginConfig.entry) : null;
    const project = isObject && 'project' in pluginConfig ? arrayify(pluginConfig.project) : entry;
    return { config, entry, project };
  }
};
