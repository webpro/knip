import { existsSync } from 'node:fs';
import mapWorkspaces from '@npmcli/map-workspaces';
import { createPkgGraph } from '@pnpm/workspace.pkgs-graph';
import micromatch from 'micromatch';
import { ConfigurationValidator } from './ConfigurationValidator.js';
import { ROOT_WORKSPACE_NAME, DEFAULT_EXTENSIONS, KNIP_CONFIG_LOCATIONS } from './constants.js';
import { defaultRules } from './issues/initializers.js';
import * as plugins from './plugins/index.js';
import { arrayify } from './util/array.js';
import parsedArgValues from './util/cli-arguments.js';
import { partitionCompilers } from './util/compilers.js';
import { ConfigurationError, LoaderError } from './util/errors.js';
import { findFile, loadJSON } from './util/fs.js';
import { getIncludedIssueTypes } from './util/get-included-issue-types.js';
import { _dirGlob } from './util/glob.js';
import { _load } from './util/loader.js';
import { getKeysByValue } from './util/object.js';
import { join, relative, toPosix } from './util/path.js';
import { normalizePluginConfig, toCamelCase } from './util/plugin.js';
import { _require } from './util/require.js';
import { unwrapFunction } from './util/unwrapFunction.js';
import { byPathDepth } from './util/workspace.js';
import type { SyncCompilers, AsyncCompilers } from './types/compilers.js';
import type {
  RawConfiguration,
  RawPluginConfiguration,
  Configuration,
  PluginName,
  PluginsConfiguration,
  WorkspaceConfiguration,
} from './types/config.js';
import type { PackageJson } from '@npmcli/package-json';

const {
  config: rawConfigArg,
  workspace: rawWorkspaceArg,
  include = [],
  exclude = [],
  dependencies = false,
  exports = false,
} = parsedArgValues;

const workspaceArg = rawWorkspaceArg ? toPosix(rawWorkspaceArg).replace(/^\.\//, '').replace(/\/$/, '') : undefined;

const getDefaultWorkspaceConfig = (extensions?: string[]): WorkspaceConfiguration => {
  const exts = [...DEFAULT_EXTENSIONS, ...(extensions ?? [])].map(ext => ext.slice(1)).join(',');

  return {
    entry: [`{index,cli,main}.{${exts}}!`, `src/{index,cli,main}.{${exts}}!`],
    project: [`**/*.{${exts}}!`],
    paths: {},
    ignore: [],
    ignoreBinaries: [],
    ignoreDependencies: [],
  };
};

const defaultConfig: Configuration = {
  rules: defaultRules,
  include: [],
  exclude: [],
  ignore: [],
  ignoreBinaries: [],
  ignoreDependencies: [],
  ignoreExportsUsedInFile: false,
  ignoreWorkspaces: [],
  syncCompilers: new Map(),
  asyncCompilers: new Map(),
  defaultWorkspaceConfig: getDefaultWorkspaceConfig(),
  rootPluginConfigs: {},
};

const PLUGIN_NAMES = Object.keys(plugins);

type ConfigurationManagerOptions = {
  cwd: string;
  isProduction: boolean;
};

export type Workspace = {
  name: string;
  pkgName: string;
  dir: string;
  ancestors: string[];
  config: WorkspaceConfiguration;
  manifestPath: string;
  manifest: PackageJson;
};

/**
 * - Loads package.json
 * - Loads knip.json/jsonc
 * - Normalizes raw local config
 * - Determines workspaces to analyze
 * - Determines issue types to report (--include/--exclude)
 * - Hands out workspace and plugin configs
 */
export class ConfigurationChief {
  cwd: string;
  isProduction = false;
  config: Configuration;

  manifestPath?: string;
  manifest?: PackageJson;

  ignoredWorkspacePatterns: string[] = [];
  manifestWorkspaces: Map<string, string> = new Map();
  additionalWorkspaceNames: Set<string> = new Set();
  availableWorkspaceNames: string[] = [];
  availableWorkspacePkgNames: Set<string | undefined> = new Set();
  availableWorkspaceDirs: string[] = [];
  availableWorkspaceManifests: { dir: string; manifest: PackageJson }[] = [];
  workspacesGraph: ReturnType<typeof createPkgGraph> | undefined;
  enabledWorkspaces: Workspace[] = [];

  resolvedConfigFilePath?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawConfig?: any;

  constructor({ cwd, isProduction }: ConfigurationManagerOptions) {
    this.cwd = cwd;
    this.isProduction = isProduction;
    this.config = defaultConfig;
  }

  public async init() {
    const manifestPath = findFile(this.cwd, 'package.json');
    const manifest = manifestPath && (await loadJSON(manifestPath));

    if (!manifestPath || !manifest) {
      throw new ConfigurationError('Unable to find package.json');
    }

    this.manifestPath = manifestPath;
    this.manifest = manifest;

    const pnpmWorkspacesPath = findFile(this.cwd, 'pnpm-workspace.yaml');
    const pnpmWorkspaces = pnpmWorkspacesPath && (await _load(pnpmWorkspacesPath));

    if (this.manifest && !this.manifest.workspaces && pnpmWorkspaces) {
      this.manifest.workspaces = pnpmWorkspaces;
    }

    for (const configPath of rawConfigArg ? [rawConfigArg] : KNIP_CONFIG_LOCATIONS) {
      this.resolvedConfigFilePath = findFile(this.cwd, configPath);
      if (this.resolvedConfigFilePath) break;
    }

    if (rawConfigArg && !this.resolvedConfigFilePath && !manifest.knip) {
      throw new ConfigurationError(`Unable to find ${rawConfigArg} or package.json#knip`);
    }

    this.rawConfig = this.resolvedConfigFilePath
      ? await this.loadResolvedConfigurationFile(this.resolvedConfigFilePath)
      : manifest.knip;

    // Have to partition compiler functions before Zod touches them
    const parsedConfig = this.rawConfig ? ConfigurationValidator.parse(partitionCompilers(this.rawConfig)) : {};
    this.config = this.normalize(parsedConfig);

    await this.setWorkspaces();
  }

  private async loadResolvedConfigurationFile(configPath: string) {
    const loadedValue = await _load(configPath);
    try {
      return await unwrapFunction(loadedValue);
    } catch (e) {
      throw new ConfigurationError(`Error running the function from ${configPath}`);
    }
  }

  public getCompilers(): [SyncCompilers, AsyncCompilers] {
    return [this.config.syncCompilers, this.config.asyncCompilers];
  }

  public getRules() {
    return this.config.rules;
  }

  public getFilters() {
    if (this.workspacesGraph?.graph && workspaceArg) return { dir: join(this.cwd, workspaceArg) };
    return {};
  }

  private normalize(rawConfig: RawConfiguration) {
    const rules = { ...defaultRules, ...rawConfig.rules };
    const include = rawConfig.include ?? defaultConfig.include;
    const exclude = rawConfig.exclude ?? defaultConfig.exclude;
    const ignore = arrayify(rawConfig.ignore ?? defaultConfig.ignore);
    const ignoreBinaries = rawConfig.ignoreBinaries ?? [];
    const ignoreExportsUsedInFile = rawConfig.ignoreExportsUsedInFile ?? false;
    const ignoreDependencies = rawConfig.ignoreDependencies ?? [];
    const ignoreWorkspaces = rawConfig.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;

    const { syncCompilers, asyncCompilers } = rawConfig;

    const extensions = [...Object.keys(syncCompilers ?? {}), ...Object.keys(asyncCompilers ?? {})];

    const defaultWorkspaceConfig = getDefaultWorkspaceConfig(extensions);

    const rootPluginConfigs: Partial<PluginsConfiguration> = {};

    for (const [name, pluginConfig] of Object.entries(rawConfig)) {
      const pluginName = toCamelCase(name) as PluginName;
      if (PLUGIN_NAMES.includes(pluginName)) {
        rootPluginConfigs[pluginName] = normalizePluginConfig(pluginConfig as RawPluginConfiguration);
      }
    }

    return {
      rules,
      include,
      exclude,
      ignore,
      ignoreBinaries,
      ignoreDependencies,
      ignoreExportsUsedInFile,
      ignoreWorkspaces,
      syncCompilers: new Map(Object.entries(syncCompilers ?? {})),
      asyncCompilers: new Map(Object.entries(asyncCompilers ?? {})),
      rootPluginConfigs,
      defaultWorkspaceConfig,
    };
  }

  private async setWorkspaces() {
    this.ignoredWorkspacePatterns = this.getIgnoredWorkspacePatterns();
    this.manifestWorkspaces = await this.getManifestWorkspaces();
    this.additionalWorkspaceNames = await this.getAdditionalWorkspaceNames();
    this.availableWorkspaceNames = this.getAvailableWorkspaceNames();
    this.availableWorkspaceDirs = this.availableWorkspaceNames
      .sort(byPathDepth)
      .reverse()
      .map(dir => join(this.cwd, dir));

    this.availableWorkspaceManifests = this.getAvailableWorkspaceManifests(this.availableWorkspaceDirs);
    this.availableWorkspacePkgNames = new Set(this.availableWorkspaceManifests.map(w => w.manifest.name));
    this.workspacesGraph = createPkgGraph(this.availableWorkspaceManifests);
    this.enabledWorkspaces = this.getEnabledWorkspaces();
  }

  private getListedWorkspaces() {
    return this.manifest?.workspaces
      ? Array.isArray(this.manifest.workspaces)
        ? this.manifest.workspaces
        : this.manifest.workspaces.packages ?? []
      : [];
  }

  private getIgnoredWorkspacePatterns() {
    const ignoredWorkspaces = this.getListedWorkspaces()
      .filter(name => name.startsWith('!'))
      .map(name => name.replace(/^!/, ''));
    return [...ignoredWorkspaces, ...this.config.ignoreWorkspaces];
  }

  private async getManifestWorkspaces() {
    const workspaces = await mapWorkspaces({
      pkg: this.manifest ?? {},
      cwd: this.cwd,
    });

    const manifestWorkspaces = new Map();
    for (const [pkgName, dir] of workspaces.entries()) {
      manifestWorkspaces.set(relative(this.cwd, dir) || ROOT_WORKSPACE_NAME, pkgName);
    }
    return manifestWorkspaces;
  }

  private getConfiguredWorkspaceKeys() {
    const initialWorkspaces = this.rawConfig?.workspaces
      ? Object.keys(this.rawConfig.workspaces)
      : [ROOT_WORKSPACE_NAME];
    const ignoreWorkspaces = this.rawConfig?.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;
    return initialWorkspaces.filter(workspaceName => !ignoreWorkspaces.includes(workspaceName));
  }

  private async getAdditionalWorkspaceNames() {
    const workspaceKeys = this.getConfiguredWorkspaceKeys();
    const patterns = workspaceKeys.filter(key => key.includes('*'));
    const dirs = workspaceKeys.filter(key => !key.includes('*'));
    const globbedDirs = await _dirGlob({ patterns, cwd: this.cwd });
    return new Set(
      [...dirs, ...globbedDirs].filter(
        name =>
          name !== ROOT_WORKSPACE_NAME &&
          !this.manifestWorkspaces.has(name) &&
          !micromatch.isMatch(name, this.ignoredWorkspacePatterns)
      )
    );
  }

  private getAvailableWorkspaceNames() {
    return [ROOT_WORKSPACE_NAME, ...this.manifestWorkspaces.keys(), ...this.additionalWorkspaceNames].filter(
      name => !micromatch.isMatch(name, this.ignoredWorkspacePatterns)
    );
  }

  private getAvailableWorkspaceManifests(availableWorkspaceDirs: string[]) {
    return availableWorkspaceDirs.map(dir => {
      const manifest: PackageJson = _require(join(dir, 'package.json'));
      if (!manifest) throw new LoaderError(`Unable to load package.json for ${dir}`);
      return { dir, manifest };
    });
  }

  private getEnabledWorkspaces() {
    if (workspaceArg && !existsSync(workspaceArg)) {
      throw new ConfigurationError(`Directory does not exist: ${workspaceArg}`);
    }

    const getAncestors = (name: string) => (ancestors: string[], ancestorName: string) => {
      if (name === ancestorName) return ancestors;
      if (ancestorName === ROOT_WORKSPACE_NAME || name.startsWith(ancestorName + '/')) ancestors.push(ancestorName);
      return ancestors;
    };

    const workspaceNames = workspaceArg
      ? [...this.availableWorkspaceNames.reduce(getAncestors(workspaceArg), []), workspaceArg]
      : this.availableWorkspaceNames;

    const graph = this.workspacesGraph?.graph;
    const ws = new Set<string>();

    if (graph && workspaceArg) {
      const seen = new Set<string>();
      const initialWorkspaces = new Set(workspaceNames.map(name => join(this.cwd, name)));
      const workspaceDirsWithDependants = new Set(initialWorkspaces);
      const addDependents = (dir: string) => {
        seen.add(dir);
        const deps = graph[dir]?.dependencies ?? [];
        if (deps.length > 0 && Array.from(initialWorkspaces).some(dir => deps.includes(dir))) {
          workspaceDirsWithDependants.add(dir);
        }
        deps.filter(dir => !seen.has(dir)).forEach(addDependents);
      };
      this.availableWorkspaceNames.map(name => join(this.cwd, name)).forEach(addDependents);
      workspaceDirsWithDependants.forEach(dir => ws.add(relative(this.cwd, dir) || ROOT_WORKSPACE_NAME));
    } else {
      workspaceNames.forEach(name => ws.add(name));
    }

    return Array.from(ws)
      .sort(byPathDepth)
      .map((name): Workspace => {
        const dir = join(this.cwd, name);
        const pkgName = this.availableWorkspaceManifests.find(p => p.dir === dir)?.manifest.name ?? `NOT_FOUND_${name}`;
        return {
          name,
          pkgName,
          dir,
          config: this.getConfigForWorkspace(name),
          ancestors: this.availableWorkspaceNames.reduce(getAncestors(name), []),
          manifestPath: join(dir, 'package.json'),
          manifest: this.availableWorkspaceManifests?.find(item => item.dir === dir)?.manifest ?? {},
        };
      });
  }

  public getWorkspaces() {
    return this.enabledWorkspaces;
  }

  private getDescendentWorkspaces(name: string) {
    return this.availableWorkspaceNames
      .filter(workspaceName => workspaceName !== name)
      .filter(workspaceName => name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(name + '/'));
  }

  private getIgnoredWorkspacesFor(name: string) {
    return this.ignoredWorkspacePatterns
      .filter(workspaceName => workspaceName !== name)
      .filter(workspaceName => name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(name));
  }

  public getNegatedWorkspacePatterns(name: string) {
    const descendentWorkspaces = this.getDescendentWorkspaces(name);
    const matchName = new RegExp(`^${name}/`);
    const ignoredWorkspaces = this.getIgnoredWorkspacesFor(name);
    return [...ignoredWorkspaces, ...descendentWorkspaces]
      .map(workspaceName => workspaceName.replace(matchName, ''))
      .map(workspaceName => `!${workspaceName}`);
  }

  private getConfigKeyForWorkspace(workspaceName: string) {
    return this.getConfiguredWorkspaceKeys()
      .sort(byPathDepth)
      .reverse()
      .find(pattern => micromatch.isMatch(workspaceName, pattern));
  }

  private getConfigForWorkspace(workspaceName: string) {
    const key = this.getConfigKeyForWorkspace(workspaceName);
    const defaultConfig = this.config.defaultWorkspaceConfig;
    const workspaces = this.rawConfig?.workspaces ?? {};
    const workspaceConfig =
      (key
        ? key === ROOT_WORKSPACE_NAME && !(ROOT_WORKSPACE_NAME in workspaces)
          ? this.rawConfig
          : workspaces[key]
        : {}) ?? {};

    const entry = workspaceConfig.entry ? arrayify(workspaceConfig.entry) : defaultConfig.entry;
    const project = workspaceConfig.project ? arrayify(workspaceConfig.project) : defaultConfig.project;
    const paths = workspaceConfig.paths ?? defaultConfig.paths;
    const ignore = arrayify(workspaceConfig.ignore);
    const ignoreBinaries = arrayify(workspaceConfig.ignoreBinaries);
    const ignoreDependencies = arrayify(workspaceConfig.ignoreDependencies);

    const plugins: Partial<PluginsConfiguration> = {};

    for (const [name, pluginConfig] of Object.entries(this.config.rootPluginConfigs)) {
      const pluginName = toCamelCase(name) as PluginName;
      if (typeof pluginConfig !== 'undefined') plugins[pluginName] = pluginConfig;
    }

    for (const [name, pluginConfig] of Object.entries(workspaceConfig)) {
      const pluginName = toCamelCase(name) as PluginName;
      if (PLUGIN_NAMES.includes(pluginName)) {
        plugins[pluginName] = normalizePluginConfig(pluginConfig as RawPluginConfiguration);
      }
    }

    return { entry, project, paths, ignore, ignoreBinaries, ignoreDependencies, ...plugins };
  }

  public getIssueTypesToReport() {
    const cliArgs = { include, exclude, dependencies, exports };
    const excludesFromRules = getKeysByValue(this.config.rules, 'off');
    const config = {
      include: this.config.include ?? [],
      exclude: [...excludesFromRules, ...this.config.exclude],
      isProduction: this.isProduction,
    };
    return getIncludedIssueTypes(cliArgs, config);
  }

  public findWorkspaceByFilePath(filePath: string) {
    const workspaceDir = this.availableWorkspaceDirs.find(workspaceDir => filePath.startsWith(workspaceDir + '/'));
    return this.enabledWorkspaces.find(workspace => workspace.dir === workspaceDir);
  }

  public getUnusedIgnoredWorkspaces() {
    const ignoredWorkspaceNames = this.config.ignoreWorkspaces;
    const workspaceNames = [...this.manifestWorkspaces.keys(), ...this.additionalWorkspaceNames];
    return ignoredWorkspaceNames.filter(
      ignoredWorkspaceName => !workspaceNames.some(name => micromatch.isMatch(name, ignoredWorkspaceName))
    );
  }
}
