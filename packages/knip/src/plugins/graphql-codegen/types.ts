type PluginConfig<T = unknown> = { [key: string]: T };
export interface ConfiguredPlugin {
  [name: string]: PluginConfig;
}
type NamedPlugin = string;

type OutputConfig = NamedPlugin | ConfiguredPlugin;
type PresetNamesBase = 'client' | 'near-operation-file' | 'gql-tag-operations' | 'graphql-modules' | 'import-types';
export type PresetNames = `${PresetNamesBase}-preset` | PresetNamesBase;

type OutputPreset = {
  buildGeneratesSection: (options: unknown) => Promise<unknown>;
  prepareDocuments?: (outputFilePath: string, outputSpecificDocuments: unknown) => Promise<unknown>;
};

export function isConfigurationOutput(config: ConfiguredOutput | ConfiguredPlugin[]): config is ConfiguredOutput {
  return 'preset' in config || 'plugins' in config;
}

interface ConfiguredOutput {
  /**
   * @type array
   * @items { "$ref": "#/definitions/GeneratedPluginsMap" }
   * @description List of plugins to apply to this current output file.
   *
   * You can either specify plugins from the community using the NPM package name (after you installed it in your project), or you can use a path to a local file for custom plugins.
   *
   * You can find a list of available plugins here: https://the-guild.dev/graphql/codegen/docs/plugins/index
   * Need a custom plugin? read this: https://the-guild.dev/graphql/codegen/docs/custom-codegen/index
   */
  plugins?: OutputConfig[];
  /**
   * @description If your setup uses Preset to have a more dynamic setup and output, set the name of your preset here.
   *
   * Presets are a way to have more than one file output, for example: https://the-guild.dev/graphql/codegen/docs/presets/near-operation-file
   *
   * You can either specify a preset from the community using the NPM package name (after you installed it in your project), or you can use a path to a local file for a custom preset.
   *
   * List of available presets: https://graphql-code-generator.com/docs/presets/presets-index
   */
  preset?: PresetNames | OutputPreset;
}
// Extracted from https://github.com/dotansimha/graphql-code-generator/blob/master/packages/utils/plugins-helpers/src/types.ts
export interface GraphqlCodegenTypes {
  /**
   * @description A map where the key represents an output path for the generated code and the value represents a set of options which are relevant for that specific file.
   *
   * For more details: https://graphql-code-generator.com/docs/config-reference/codegen-config
   */
  generates: {
    [outputPath: string]: ConfiguredOutput | ConfiguredPlugin[];
  };
}
