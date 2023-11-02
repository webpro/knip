import * as npm from './manifest/index.js';
import * as plugins from './plugins/index.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { _pureGlob, negate, hasProductionSuffix, hasNoProductionSuffix, prependDirToPattern } from './util/glob.js';
import { FAKE_PATH } from './util/loader.js';
import { get, getKeysByValue } from './util/object.js';
import { join, toPosix } from './util/path.js';
import {
  fromEntryPattern,
  fromProductionEntryPattern,
  isEntryPattern,
  isProductionEntryPattern,
} from './util/protocols.js';
import type { Configuration, EnsuredPluginConfiguration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { PackageJsonWithPlugins } from './types/package-json.js';
import type { InstalledBinaries, HostDependencies } from './types/workspace.js';
import type { Entries } from 'type-fest';

type PluginNames = Entries<typeof plugins>;

type WorkspaceManagerOptions = {
  name: string;
  dir: string;
  cwd: string;
  config: WorkspaceConfiguration;
  manifest: PackageJsonWithPlugins;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[];
  enabledPluginsInAncestors: string[];
  isProduction: boolean;
  isStrict: boolean;
};

type ReferencedDependencies = Set<[string, string]>;

const nullConfig: EnsuredPluginConfiguration = { config: null, entry: null, project: null };

/**
 * - Determines enabled plugins
 * - Finds referenced dependencies and binaries in npm scripts
 * - Collects peer dependencies
 * - Hands out workspace and plugin glob patterns
 * - Calls enabled plugins to find referenced dependencies
 */
export class WorkspaceWorker {
  name: string;
  dir: string;
  cwd: string;
  config: WorkspaceConfiguration;
  manifest: PackageJsonWithPlugins;
  isProduction;
  isStrict;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[] = [];
  enabledPluginsInAncestors: string[];

  enabled: Record<PluginName, boolean>;
  enabledPlugins: PluginName[] = [];
  referencedDependencies: ReferencedDependencies = new Set();
  hostDependencies: HostDependencies = new Map();
  installedBinaries: InstalledBinaries = new Map();
  hasTypesIncluded: Set<string> = new Set();
  entryFilePatterns: Set<string> = new Set();
  productionEntryFilePatterns: Set<string> = new Set();

  constructor({
    name,
    dir,
    cwd,
    config,
    manifest,
    isProduction,
    isStrict,
    rootIgnore,
    negatedWorkspacePatterns,
    enabledPluginsInAncestors,
  }: WorkspaceManagerOptions) {
    this.name = name;
    this.dir = dir;
    this.cwd = cwd;
    this.config = config;
    this.manifest = manifest;
    this.isProduction = isProduction;
    this.isStrict = isStrict;
    this.rootIgnore = rootIgnore;
    this.negatedWorkspacePatterns = negatedWorkspacePatterns;
    this.enabledPluginsInAncestors = enabledPluginsInAncestors;

    this.enabled = Object.keys(plugins).reduce(
      (enabled, pluginName) => ({ ...enabled, [pluginName]: false }),
      {} as Record<PluginName, boolean>
    );
  }

  public async init() {
    await this.setEnabledPlugins();
    await this.initReferencedDependencies();
  }

  private async setEnabledPlugins() {
    const manifest = this.manifest;
    const deps = Object.keys(manifest.dependencies ?? {});
    const devDeps = Object.keys(manifest.devDependencies ?? {});
    const dependencies = new Set([...deps, ...devDeps]);

    const pluginEntries = Object.entries(plugins) as PluginNames;

    for (const [pluginName, plugin] of pluginEntries) {
      if (this.config[pluginName] === false) continue;
      if (this.config[pluginName]) {
        this.enabled[pluginName] = true;
        continue;
      }
      const isEnabledInAncestor = this.enabledPluginsInAncestors.includes(pluginName);
      if (
        isEnabledInAncestor ||
        (await plugin.isEnabled({ cwd: this.dir, manifest, dependencies, config: this.config }))
      ) {
        this.enabled[pluginName] = true;
      }
    }

    this.enabledPlugins = getKeysByValue(this.enabled, true);

    const enabledPluginNames = this.enabledPlugins.map(name => plugins[name].NAME);

    debugLogObject(this.name, `Enabled plugins (${this.name})`, enabledPluginNames);
  }

  private async initReferencedDependencies() {
    const { dependencies, hostDependencies, installedBinaries, hasTypesIncluded } = await npm.findDependencies({
      manifest: this.manifest,
      isProduction: this.isProduction,
      isStrict: this.isStrict,
      dir: this.dir,
      cwd: this.cwd,
    });

    const filePath = join(this.dir, 'package.json');
    dependencies.forEach(dependency => this.referencedDependencies.add([filePath, dependency]));
    this.hostDependencies = hostDependencies;
    this.installedBinaries = installedBinaries;
    this.hasTypesIncluded = hasTypesIncluded;
    this.hasTypesIncluded = hasTypesIncluded;
  }

  private getConfigForPlugin(pluginName: PluginName): EnsuredPluginConfiguration {
    const config = this.config[pluginName];
    return typeof config === 'undefined' || typeof config === 'boolean' ? nullConfig : config;
  }

  getEntryFilePatterns() {
    const { entry } = this.config;
    if (entry.length === 0) return [];
    return [entry, this.negatedWorkspacePatterns].flat();
  }

  getProjectFilePatterns(testFilePatterns: string[]) {
    const { project } = this.config;
    if (project.length === 0) return [];

    const negatedPluginConfigPatterns = this.getPluginConfigPatterns().map(negate);
    const negatedPluginProjectFilePatterns = this.getPluginProjectFilePatterns().map(negate);

    return [
      project,
      negatedPluginConfigPatterns,
      negatedPluginProjectFilePatterns,
      testFilePatterns,
      this.negatedWorkspacePatterns,
    ].flat();
  }

  getPluginProjectFilePatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabled[pluginName]) {
        const { entry, project } = pluginConfig;
        patterns.push(...(project ?? entry ?? ('PROJECT_FILE_PATTERNS' in plugin ? plugin.PROJECT_FILE_PATTERNS : [])));
      }
    }
    return [patterns, this.negatedWorkspacePatterns].flat();
  }

  getPluginConfigPatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabled[pluginName] && pluginConfig) {
        const { config } = pluginConfig;
        const defaultConfigFiles = 'CONFIG_FILE_PATTERNS' in plugin ? plugin.CONFIG_FILE_PATTERNS : [];
        patterns.push(...(config ?? defaultConfigFiles));
      }
    }
    return patterns;
  }

  getProductionEntryFilePatterns(negatedTestFilePatterns: string[]) {
    const entry = this.config.entry.filter(hasProductionSuffix);
    if (entry.length === 0) return [];
    const negatedEntryFiles = this.config.entry.filter(hasNoProductionSuffix).map(negate);
    return [entry, negatedEntryFiles, negatedTestFilePatterns, this.negatedWorkspacePatterns].flat();
  }

  getProductionProjectFilePatterns(negatedTestFilePatterns: string[]) {
    const project = this.config.project;
    if (project.length === 0) return this.getProductionEntryFilePatterns(negatedTestFilePatterns);
    const _project = this.config.project.map(pattern => {
      if (!pattern.endsWith('!') && !pattern.startsWith('!')) return negate(pattern);
      return pattern;
    });
    const negatedEntryFiles = this.config.entry.filter(hasNoProductionSuffix).map(negate);
    const negatedPluginConfigPatterns = this.getPluginConfigPatterns().map(negate);
    const negatedPluginProjectFilePatterns = this.getPluginProjectFilePatterns().map(negate);

    return [
      _project,
      negatedEntryFiles,
      negatedPluginConfigPatterns,
      negatedPluginProjectFilePatterns,
      negatedTestFilePatterns,
      this.negatedWorkspacePatterns,
    ].flat();
  }

  private getConfigurationFilePatterns(pluginName: PluginName) {
    const plugin = plugins[pluginName];
    const pluginConfig = this.getConfigForPlugin(pluginName);
    if (pluginConfig) {
      const defaultConfig = 'CONFIG_FILE_PATTERNS' in plugin ? plugin.CONFIG_FILE_PATTERNS : [];
      return pluginConfig.config ?? defaultConfig;
    }
    return [];
  }

  public getIgnorePatterns() {
    return [...this.rootIgnore, ...this.config.ignore.map(pattern => prependDirToPattern(this.name, pattern))];
  }

  private async findDependenciesByPlugins() {
    const name = this.name;
    const cwd = this.dir;
    const ignore = this.getIgnorePatterns();

    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        const hasDependencyFinder = 'findDependencies' in plugin && typeof plugin.findDependencies === 'function';
        if (hasDependencyFinder) {
          const pluginConfig = this.getConfigForPlugin(pluginName);

          if (!pluginConfig) continue;

          const patterns = this.getConfigurationFilePatterns(pluginName);
          const allConfigFilePaths = await _pureGlob({ patterns, cwd, ignore, gitignore: false });

          const configFilePaths = allConfigFilePaths.filter(
            filePath =>
              !filePath.endsWith('package.json') ||
              get(this.manifest, 'PACKAGE_JSON_PATH' in plugin ? plugin.PACKAGE_JSON_PATH : pluginName)
          );

          debugLogArray([name, plugin.NAME], 'config file paths', configFilePaths);

          // Plugin has no config files configured, add one to still invoke it and get the entry:/production: patterns
          if (configFilePaths.length === 0) configFilePaths.push(FAKE_PATH);

          const pluginDependencies: Set<string> = new Set();

          for (const configFilePath of configFilePaths) {
            const dependencies = await plugin.findDependencies(configFilePath, {
              cwd,
              manifest: this.manifest,
              config: pluginConfig,
              isProduction: this.isProduction,
            });

            dependencies.forEach(specifier => {
              pluginDependencies.add(specifier);
              if (isEntryPattern(specifier)) {
                this.entryFilePatterns.add(fromEntryPattern(specifier));
              } else if (isProductionEntryPattern(specifier)) {
                this.productionEntryFilePatterns.add(fromProductionEntryPattern(specifier));
              } else {
                this.referencedDependencies.add([configFilePath, toPosix(specifier)]);
              }
            });
          }

          debugLogArray([name, plugin.NAME], 'dependencies', pluginDependencies);
        }
      }
    }
  }

  public async findAllDependencies() {
    await this.findDependenciesByPlugins();

    return {
      hostDependencies: this.hostDependencies,
      installedBinaries: this.installedBinaries,
      referencedDependencies: this.referencedDependencies,
      hasTypesIncluded: this.hasTypesIncluded,
      enabledPlugins: this.enabledPlugins,
      entryFilePatterns: Array.from(this.entryFilePatterns),
      productionEntryFilePatterns: Array.from(this.productionEntryFilePatterns),
    };
  }
}
