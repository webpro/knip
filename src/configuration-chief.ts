import path from 'node:path';
import mapWorkspaces from '@npmcli/map-workspaces';
import micromatch from 'micromatch';
import { z } from 'zod';
import { ConfigurationValidator } from './configuration-validator.js';
import { ROOT_WORKSPACE_NAME, DEFAULT_WORKSPACE_CONFIG, KNIP_CONFIG_LOCATIONS } from './constants.js';
import * as plugins from './plugins/index.js';
import { arrayify } from './util/array.js';
import parsedArgs from './util/cli-arguments.js';
import { ConfigurationError } from './util/errors.js';
import { findFile, loadJSON } from './util/fs.js';
import { ensurePosixPath } from './util/glob.js';
import { _load } from './util/loader.js';
import { toCamelCase } from './util/plugin.js';
import { resolveIncludedIssueTypes } from './util/resolve-included-issue-types.js';
import { byPathDepth } from './util/workspace.js';
import type { Configuration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { PackageJson } from '@npmcli/package-json';

const {
  values: {
    config: rawConfigArg,
    workspace: rawWorkspaceArg,
    include = [],
    exclude = [],
    dependencies = false,
    exports = false,
  },
} = parsedArgs;

const defaultWorkspaceConfig: WorkspaceConfiguration = DEFAULT_WORKSPACE_CONFIG;

const defaultConfig: Configuration = {
  include: [],
  exclude: [],
  ignore: [],
  ignoreBinaries: [],
  ignoreDependencies: [],
  ignoreWorkspaces: [],
  workspaces: {
    [ROOT_WORKSPACE_NAME]: defaultWorkspaceConfig,
  },
};

const PLUGIN_NAMES = Object.keys(plugins);

type ConfigurationManagerOptions = {
  cwd: string;
  isProduction: boolean;
};

/**
 * - Loads package.json
 * - Loads knip.json/jsonc
 * - Normalizes raw local config
 * - Determines workspaces to analyze
 * - Determines issue types to report (--include/--exclude)
 * - Hands out workspace and plugin configs
 */
export default class ConfigurationChief {
  cwd: string;
  isProduction = false;
  config: Configuration;

  manifestPath: undefined | string;
  manifest: undefined | PackageJson;
  manifestWorkspaces: undefined | string[];

  constructor({ cwd, isProduction }: ConfigurationManagerOptions) {
    this.cwd = cwd;
    this.isProduction = isProduction;
    this.config = defaultConfig;
  }

  async loadLocalConfig() {
    const manifestPath = await findFile(this.cwd, 'package.json');
    const manifest = manifestPath && (await loadJSON(manifestPath));

    if (!manifestPath || !manifest) {
      throw new ConfigurationError('Unable to find package.json');
    }

    this.manifestPath = manifestPath;
    this.manifest = manifest;

    let resolvedConfigFilePath;
    for (const configPath of rawConfigArg ? [rawConfigArg] : KNIP_CONFIG_LOCATIONS) {
      resolvedConfigFilePath = await findFile(this.cwd, configPath);
      if (resolvedConfigFilePath) break;
    }

    if (rawConfigArg && !resolvedConfigFilePath && !manifest.knip) {
      throw new ConfigurationError(`Unable to find ${rawConfigArg} or package.json#knip`);
    }

    const rawLocalConfig = resolvedConfigFilePath ? await _load(resolvedConfigFilePath) : manifest.knip;

    if (rawLocalConfig) {
      this.config = this.normalize(ConfigurationValidator.parse(rawLocalConfig));
    }
  }

  normalize(rawLocalConfig: z.infer<typeof ConfigurationValidator>) {
    const workspaces = rawLocalConfig.workspaces ?? {
      [ROOT_WORKSPACE_NAME]: {
        ...rawLocalConfig,
      },
    };

    const include = rawLocalConfig.include ?? defaultConfig.include;
    const exclude = rawLocalConfig.exclude ?? defaultConfig.exclude;
    const ignore = arrayify(rawLocalConfig.ignore ?? defaultConfig.ignore);
    const ignoreBinaries = rawLocalConfig.ignoreBinaries ?? defaultConfig.ignoreBinaries;
    const ignoreDependencies = rawLocalConfig.ignoreDependencies ?? defaultConfig.ignoreDependencies;
    const ignoreWorkspaces = rawLocalConfig.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;

    return {
      include,
      exclude,
      ignore,
      ignoreBinaries,
      ignoreDependencies,
      ignoreWorkspaces,
      workspaces: Object.entries(workspaces)
        .filter(([workspaceName]) => !ignoreWorkspaces.includes(workspaceName))
        .reduce((workspaces, workspace) => {
          const [workspaceName, workspaceConfig] = workspace;

          const entry = workspaceConfig.entry ? arrayify(workspaceConfig.entry) : defaultWorkspaceConfig.entry;

          const project = workspaceConfig.project
            ? arrayify(workspaceConfig.project)
            : workspaceConfig.entry
            ? entry
            : defaultWorkspaceConfig.project;

          workspaces[workspaceName] = {
            entry,
            project,
            ignore: arrayify(workspaceConfig.ignore),
          };

          for (const [pluginName, pluginConfig] of Object.entries(workspaceConfig)) {
            const name = toCamelCase(pluginName) as PluginName;
            if (PLUGIN_NAMES.includes(name)) {
              if (pluginConfig === false) {
                workspaces[workspaceName][name] = false;
              } else {
                const isObject = typeof pluginConfig !== 'string' && !Array.isArray(pluginConfig);
                const config = isObject ? arrayify(pluginConfig.config) : pluginConfig ? arrayify(pluginConfig) : null;
                const entry = isObject && 'entry' in pluginConfig ? arrayify(pluginConfig.entry) : null;
                const project = isObject && 'project' in pluginConfig ? arrayify(pluginConfig.project) : entry;
                workspaces[workspaceName][name] = {
                  config,
                  entry,
                  project,
                };
              }
            }
          }
          return workspaces;
        }, {} as Record<string, WorkspaceConfiguration>),
    };
  }

  private async getManifestWorkspaces(): Promise<string[]> {
    if (this.manifestWorkspaces) return this.manifestWorkspaces;
    if (this.manifest) {
      const workspaces = await mapWorkspaces({
        pkg: this.manifest,
        cwd: this.cwd,
        ignore: this.config.ignoreWorkspaces,
        absolute: false,
      });
      this.manifestWorkspaces = Array.from(workspaces.values())
        .map(dir => path.relative(this.cwd, dir))
        .map(ensurePosixPath);
      return this.manifestWorkspaces;
    }
    return [];
  }

  private getConfiguredWorkspaces() {
    return this.config.workspaces ? Object.keys(this.config.workspaces) : [];
  }

  getAdditionalWorkspaces(manifestWorkspaces: string[]) {
    return Object.keys(this.config.workspaces).filter(
      name => !name.includes('*') && !manifestWorkspaces.includes(name)
    );
  }

  public async getActiveWorkspaces() {
    const manifestWorkspaces = await this.getManifestWorkspaces();

    const additionalWorkspaces = this.getAdditionalWorkspaces(manifestWorkspaces);

    const rootWorkspace = {
      name: ROOT_WORKSPACE_NAME,
      dir: this.cwd,
      config: this.getConfigForWorkspace(ROOT_WORKSPACE_NAME),
      ancestors: [],
    };

    const isOnlyRootWorkspace =
      (manifestWorkspaces.length === 0 && !rawWorkspaceArg) ||
      (rawWorkspaceArg && [ROOT_WORKSPACE_NAME, './'].includes(rawWorkspaceArg));

    if (isOnlyRootWorkspace) return [rootWorkspace];

    if (rawWorkspaceArg) {
      const workspace = {
        name: rawWorkspaceArg,
        dir: path.resolve(this.cwd, rawWorkspaceArg),
        config: this.getConfigForWorkspace(rawWorkspaceArg),
        ancestors: [ROOT_WORKSPACE_NAME],
      };
      return this.hasConfigForWorkspace(ROOT_WORKSPACE_NAME) ? [rootWorkspace, workspace] : [workspace];
    }

    const workspaces = [...manifestWorkspaces, ...additionalWorkspaces];
    const activeWorkspaces = workspaces.filter(workspaceName => this.hasConfigForWorkspace(workspaceName));

    // Return intersection: package.json#workspaces with a match in knip.config#workspaces
    // Also return the additional configured workspaces in knip.json that are not in package.json#workspaces
    return activeWorkspaces.sort(byPathDepth).map(name => ({
      name,
      dir: path.resolve(this.cwd, name),
      config: this.getConfigForWorkspace(name),
      ancestors: activeWorkspaces.reduce((ancestors, ancestorName) => {
        if (name === ancestorName) return ancestors;
        if (ancestorName === ROOT_WORKSPACE_NAME || name.startsWith(ancestorName)) {
          if (this.hasConfigForWorkspace(ancestorName)) {
            ancestors.push(ancestorName);
          }
        }
        return ancestors;
      }, [] as string[]),
    }));
  }

  async getDescendentWorkspaces(name: string) {
    const manifestWorkspaces = await this.getManifestWorkspaces();
    const additionalWorkspaces = this.getAdditionalWorkspaces(manifestWorkspaces);
    return [...manifestWorkspaces, ...additionalWorkspaces]
      .filter(workspaceName => workspaceName !== name)
      .filter(workspaceName => name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(name));
  }

  async getNegatedWorkspacePatterns(name: string) {
    const descendentWorkspaces = await this.getDescendentWorkspaces(name);
    const matchName = new RegExp(`^${name}/`);
    return descendentWorkspaces
      .map(workspaceName => workspaceName.replace(matchName, ''))
      .map(workspaceName => `!${workspaceName}`);
  }

  private getConfigKeyForWorkspace(workspaceName: string) {
    const configuredWorkspaces = this.getConfiguredWorkspaces();
    return configuredWorkspaces
      .sort(byPathDepth)
      .reverse()
      .find(pattern => micromatch.isMatch(workspaceName, pattern));
  }

  private hasConfigForWorkspace(workspaceName: string) {
    return Boolean(this.getConfigKeyForWorkspace(workspaceName));
  }

  getConfigForWorkspace(workspaceName: string) {
    const key = this.getConfigKeyForWorkspace(workspaceName);
    if (key && this.config?.workspaces?.[key]) return this.config.workspaces[key];
    return { entry: [], project: [], ignore: [] };
  }

  resolveIncludedIssueTypes() {
    return resolveIncludedIssueTypes(
      {
        include,
        exclude,
        dependencies,
        exports,
      },
      {
        include: this.config.include ?? [],
        exclude: this.config.exclude ?? [],
        isProduction: this.isProduction,
      }
    );
  }
}
