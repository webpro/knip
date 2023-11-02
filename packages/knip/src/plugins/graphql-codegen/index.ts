import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { isConfigurationOutput } from './types.js';
import type { ConfiguredPlugin, GraphqlCodegenTypes, PresetNames } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://the-guild.dev/graphql/codegen/docs/config-reference/codegen-config

export const NAME = 'GraphQL Codegen';

/** @public */
export const ENABLERS = [/^@graphql-codegen\//];

export const PACKAGE_JSON_PATH = 'codegen';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['codegen.{ts,js,json,yml,mjs,cts}', 'package.json'];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: GraphqlCodegenTypes | undefined = configFilePath.endsWith('package.json')
    ? manifest[PACKAGE_JSON_PATH]
    : await load(configFilePath);

  if (!localConfig) return [];

  const generateSet = Object.values(localConfig.generates);

  const configurationOutput = generateSet.filter(isConfigurationOutput);

  const presets = configurationOutput
    .map(configOutput => (configOutput.preset ? configOutput.preset : undefined))
    .filter((preset): preset is PresetNames => typeof preset === 'string')
    .map(presetName => `@graphql-codegen/${presetName}${presetName.endsWith('-preset') ? '' : '-preset'}`);

  const flatPlugins = generateSet
    .filter((config): config is ConfiguredPlugin => !isConfigurationOutput(config))
    .flatMap(item => Object.keys(item))
    .map(plugin => `@graphql-codegen/${plugin}`);

  const nestedPlugins = configurationOutput
    .flatMap(configOutput => (configOutput.plugins ? configOutput.plugins : []))
    .map(plugin => `@graphql-codegen/${plugin}`);

  return [...presets, ...flatPlugins, ...nestedPlugins];
};

export const findDependencies = timerify(findPluginDependencies);
