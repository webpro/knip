import { watch } from 'node:fs';
import { CacheConsultant } from './CacheConsultant.js';
import { ConfigurationChief } from './ConfigurationChief.js';
import { ConsoleStreamer } from './ConsoleStreamer.js';
import { DependencyDeputy } from './DependencyDeputy.js';
import { IssueCollector } from './IssueCollector.js';
import { IssueFixer } from './IssueFixer.js';
import { PrincipalFactory } from './PrincipalFactory.js';
import type { ProjectPrincipal } from './ProjectPrincipal.js';
import { WorkspaceWorker } from './WorkspaceWorker.js';
import { _getDependenciesFromScripts } from './binaries/index.js';
import { getCompilerExtensions, getIncludedCompilers } from './compilers/index.js';
import { getFilteredScripts } from './manifest/helpers.js';
import watchReporter from './reporters/watch.js';
import type { CommandLineOptions } from './types/cli.js';
import type {
  SerializableExport,
  SerializableExportMember,
  SerializableImportMap,
  SerializableImports,
  SerializableMap,
} from './types/serializable-map.js';
import { debugLog, debugLogArray, debugLogObject } from './util/debug.js';
import { isFile } from './util/fs.js';
import { getReExportingEntryFileHandler } from './util/get-reexporting-entry-file.js';
import { _glob, negate } from './util/glob.js';
import { getGitIgnoredFn } from './util/globby.js';
import { getHandler } from './util/handle-dependency.js';
import { getIsIdentifierReferencedHandler } from './util/is-identifier-referenced.js';
import { getEntryPathFromManifest, getPackageNameFromModuleSpecifier } from './util/modules.js';
import { dirname, join, toPosix } from './util/path.js';
import { hasMatch } from './util/regex.js';
import { shouldIgnore } from './util/tag.js';
import { augmentWorkspace, getToSourcePathHandler } from './util/to-source-path.js';
import { loadTSConfig } from './util/tsconfig-loader.js';
import { getHasStrictlyNsReferences, getType } from './util/type.js';

export type { RawConfiguration as KnipConfig } from './types/config.js';
export type { Preprocessor, Reporter, ReporterOptions } from './types/issues.js';

export const main = async (unresolvedConfiguration: CommandLineOptions) => {
  const {
    cwd,
    tsConfigFile,
    gitignore,
    isStrict,
    isProduction,
    isShowProgress,
    isIncludeEntryExports,
    isIncludeLibs,
    isIsolateWorkspaces,
    isDebug,
    isWatch,
    tags,
    isFix,
    fixTypes,
    isRemoveFiles,
  } = unresolvedConfiguration;

  debugLogObject('*', 'Unresolved configuration (from CLI arguments)', unresolvedConfiguration);

  const chief = new ConfigurationChief({ cwd, isProduction, isStrict, isIncludeEntryExports });
  const deputy = new DependencyDeputy({ isProduction, isStrict });
  const factory = new PrincipalFactory();
  const streamer = new ConsoleStreamer({ isEnabled: isShowProgress });

  const isGitIgnored = await getGitIgnoredFn({ cwd, gitignore });
  const toSourceFilePath = getToSourcePathHandler(chief);

  streamer.cast('Reading workspace configuration(s)...');

  await chief.init();

  const workspaces = chief.getIncludedWorkspaces();
  const report = chief.getIncludedIssueTypes();
  const rules = chief.getRules();
  const filters = chief.getFilters();
  const fixer = new IssueFixer({ isEnabled: isFix, cwd, fixTypes, isRemoveFiles });

  debugLogObject('*', 'Included issue types', report);

  const isReportDependencies = report.dependencies || report.unlisted || report.unresolved;
  const isReportValues = report.exports || report.nsExports || report.classMembers;
  const isReportTypes = report.types || report.nsTypes || report.enumMembers;
  const isReportClassMembers = report.classMembers;
  const isSkipLibs = !(isIncludeLibs || isReportClassMembers);

  const collector = new IssueCollector({ cwd, rules, filters });

  const enabledPluginsStore = new Map<string, string[]>();

  const o = () => workspaces.map(w => ({ pkgName: w.pkgName, name: w.name, config: w.config, ancestors: w.ancestors }));
  debugLogObject('*', 'Included workspaces', () => workspaces.map(w => w.pkgName));
  debugLogObject('*', 'Included workspace configs', o);

  for (const workspace of workspaces) {
    const { name, dir, ancestors, pkgName, manifestPath } = workspace;

    streamer.cast(`Analyzing workspace ${name}...`);

    const manifest = chief.getManifestForWorkspace(name);
    const { ignoreBinaries, ignoreDependencies } = chief.getIgnores(name);

    if (!manifest) continue;

    deputy.addWorkspace({ name, cwd, dir, manifestPath, manifest, ignoreBinaries, ignoreDependencies });
    const dependencies = deputy.getDependencies(name);

    const compilers = getIncludedCompilers(chief.config.syncCompilers, chief.config.asyncCompilers, dependencies);
    const extensions = getCompilerExtensions(compilers);
    const config = chief.getConfigForWorkspace(name, extensions);

    const filteredScripts = getFilteredScripts({ isProduction, scripts: manifest.scripts });
    const manifestScripts = Object.values(filteredScripts);
    const manifestScriptNames = new Set(Object.keys(manifest.scripts ?? {}));

    const { isFile, compilerOptions, definitionPaths } = await loadTSConfig(join(dir, tsConfigFile ?? 'tsconfig.json'));

    if (isFile) augmentWorkspace(workspace, dir, compilerOptions);

    const principal = factory.getPrincipal({
      cwd: dir,
      paths: config.paths,
      compilerOptions,
      compilers,
      pkgName,
      isGitIgnored,
      isIsolateWorkspaces,
      isSkipLibs,
      isWatch,
    });

    const worker = new WorkspaceWorker({
      name,
      dir,
      cwd,
      config,
      manifest,
      dependencies,
      isProduction,
      isStrict,
      rootIgnore: chief.config.ignore,
      negatedWorkspacePatterns: chief.getNegatedWorkspacePatterns(name),
      enabledPluginsInAncestors: ancestors.flatMap(ancestor => enabledPluginsStore.get(ancestor) ?? []),
    });

    await worker.init();

    principal.addEntryPaths(definitionPaths);
    debugLogArray(name, 'Definition paths', definitionPaths);

    const ignore = worker.getIgnorePatterns();
    const sharedGlobOptions = { cwd, workingDir: dir, gitignore };

    collector.addIgnorePatterns(ignore.map(pattern => join(cwd, pattern)));

    // Add dependencies from package.json
    const options = { manifestScriptNames, cwd: dir, dependencies };
    const dependenciesFromManifest = _getDependenciesFromScripts(manifestScripts, options);
    principal.addReferencedDependencies(name, new Set(dependenciesFromManifest.map(id => [manifestPath, id])));

    // Add entry paths from package.json
    const entryPathsFromManifest = await getEntryPathFromManifest(manifest, { ...sharedGlobOptions, ignore });
    debugLogArray(name, 'Entry paths in package.json', entryPathsFromManifest);
    principal.addEntryPaths(entryPathsFromManifest);

    // Run plugins
    const { referencedDependencies, enabledPlugins, entryFilePatterns, productionEntryFilePatterns } =
      await worker.findDependenciesByPlugins();
    enabledPluginsStore.set(name, enabledPlugins);
    principal.addReferencedDependencies(name, referencedDependencies);

    if (isProduction) {
      const negatedEntryPatterns: string[] = Array.from(entryFilePatterns).map(negate);

      {
        const patterns = worker.getProductionEntryFilePatterns(negatedEntryPatterns);
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Entry paths', workspaceEntryPaths);
        principal.addEntryPaths(workspaceEntryPaths);
      }

      {
        const patterns = Array.from(productionEntryFilePatterns);
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Production plugin entry paths', pluginWorkspaceEntryPaths);
        principal.addEntryPaths(pluginWorkspaceEntryPaths, { skipExportsAnalysis: true });
      }

      {
        const patterns = worker.getProductionProjectFilePatterns(negatedEntryPatterns);
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Project paths', workspaceProjectPaths);
        for (const projectPath of workspaceProjectPaths) principal.addProjectPath(projectPath);
      }
    } else {
      {
        const patterns = worker.getEntryFilePatterns();
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Entry paths', workspaceEntryPaths);
        principal.addEntryPaths(workspaceEntryPaths);
      }

      {
        const patterns = worker.getProjectFilePatterns([...productionEntryFilePatterns]);
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Project paths', workspaceProjectPaths);
        for (const projectPath of workspaceProjectPaths) principal.addProjectPath(projectPath);
      }

      {
        const patterns = [...entryFilePatterns, ...productionEntryFilePatterns];
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Plugin entry paths', pluginWorkspaceEntryPaths);
        principal.addEntryPaths(pluginWorkspaceEntryPaths, { skipExportsAnalysis: true });
      }

      {
        const patterns = worker.getPluginProjectFilePatterns();
        const pluginWorkspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Plugin project paths', pluginWorkspaceProjectPaths);
        for (const projectPath of pluginWorkspaceProjectPaths) principal.addProjectPath(projectPath);
      }

      {
        const patterns = worker.getPluginConfigPatterns();
        const configurationEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Plugin configuration paths', configurationEntryPaths);
        principal.addEntryPaths(configurationEntryPaths, { skipExportsAnalysis: true });
      }
    }

    // Add knip.ts (might import dependencies)
    if (chief.resolvedConfigFilePath) {
      principal.addEntryPath(chief.resolvedConfigFilePath, { skipExportsAnalysis: true });
    }

    worker.onDispose();
  }

  const principals = factory.getPrincipals();

  debugLog('*', `Created ${principals.length} programs for ${workspaces.length} workspaces`);

  let serializableMap: SerializableMap = {};
  const analyzedFiles = new Set<string>();
  const unreferencedFiles = new Set<string>();
  const entryPaths = new Set<string>();
  const internalWorkspaceFilePaths = new Set<string>();

  const handleReferencedDependency = getHandler(collector, deputy, chief);

  const updateImports = (importedModule: SerializableImports, importItems: SerializableImports) => {
    for (const id of importItems.refs) importedModule.refs.add(id);
    for (const id of importItems.importedAs) importedModule.importedAs.add(id);
    for (const id of importItems.importedNs) importedModule.importedNs.add(id);
    for (const id of importItems.isReExportedBy) importedModule.isReExportedBy.add(id);
    for (const id of importItems.isReExportedNs) importedModule.isReExportedNs.add(id);
    if (importItems.hasStar) importedModule.hasStar = true;
    if (importItems.isReExport) importedModule.isReExport = true;
  };

  const updateImported = (filePath: string, importItems: SerializableImports) => {
    serializableMap[filePath] = serializableMap[filePath] || {};
    const importedFile = serializableMap[filePath];
    if (!importedFile.imported) importedFile.imported = importItems;
    else updateImports(importedFile.imported, importItems);
  };

  const setInternalImports = (filePath: string, internalImports: SerializableImportMap) => {
    for (const [specifierFilePath, importItems] of Object.entries(internalImports)) {
      // Update import stats for current module
      const file = serializableMap[filePath];
      if (!file.imports.internal[specifierFilePath]) file.imports.internal[specifierFilePath] = importItems;
      else updateImports(file.imports.internal[specifierFilePath], importItems);

      // Update import stats for imported module
      updateImported(specifierFilePath, importItems);

      // Handle "external" imports from internal workspaces
      const packageName = getPackageNameFromModuleSpecifier(importItems.specifier);
      if (packageName && chief.availableWorkspacePkgNames.has(packageName)) {
        serializableMap[filePath].imports.external.add(packageName);
        const workspace = chief.findWorkspaceByFilePath(specifierFilePath);
        if (workspace) {
          const principal = factory.getPrincipalByPackageName(workspace.pkgName);
          if (principal && !isGitIgnored(specifierFilePath)) {
            // Defer to prevent potential duplicate analysis and infinite recursion
            internalWorkspaceFilePaths.add(specifierFilePath);
          }
        }
      }
    }
  };

  const analyzeSourceFile = (filePath: string, principal: ProjectPrincipal) => {
    if (analyzedFiles.has(filePath)) return;
    analyzedFiles.add(filePath);

    const workspace = chief.findWorkspaceByFilePath(filePath);
    if (workspace) {
      const { imports, exports, scripts } = principal.analyzeSourceFile(filePath, {
        skipTypeOnly: isStrict,
        isFixExports: fixer.isEnabled && fixer.isFixUnusedExports,
        isFixTypes: fixer.isEnabled && fixer.isFixUnusedTypes,
        ignoreExportsUsedInFile: Boolean(chief.config.ignoreExportsUsedInFile),
        isReportClassMembers,
        tags,
      });

      serializableMap[filePath] = serializableMap[filePath] || {};
      serializableMap[filePath].internalImportCache = imports.internal;
      serializableMap[filePath].imports = { ...imports, internal: {} };
      serializableMap[filePath].exports = exports;
      serializableMap[filePath].scripts = scripts;

      setInternalImports(filePath, imports.internal);

      // Handle scripts here since they might lead to more entry files
      if (scripts.size > 0) {
        const cwd = dirname(filePath);
        const dependencies = deputy.getDependencies(workspace.name);
        const manifestScriptNames = new Set<string>();
        const specifiers = _getDependenciesFromScripts(scripts, { cwd, manifestScriptNames, dependencies });
        for (const specifier of specifiers) {
          const specifierFilePath = handleReferencedDependency(specifier, filePath, workspace);
          if (specifierFilePath) analyzeSourceFile(specifierFilePath, principal);
        }
      }
    }
  };

  for (const principal of principals) {
    principal.init(toSourceFilePath);

    for (const [containingFilePath, specifier, workspaceName] of principal.referencedDependencies) {
      const workspace = chief.findWorkspaceByName(workspaceName);
      if (workspace) {
        const specifierFilePath = handleReferencedDependency(specifier, containingFilePath, workspace);
        if (specifierFilePath) principal.addEntryPath(specifierFilePath);
      }
    }

    streamer.cast('Running async compilers...');

    await principal.runAsyncCompilers();

    streamer.cast('Analyzing source files...');

    let size = principal.entryPaths.size;
    let round = 0;

    do {
      size = principal.entryPaths.size;
      const resolvedFiles = principal.getUsedResolvedFiles();
      const files = resolvedFiles.filter(filePath => !analyzedFiles.has(filePath));

      debugLogArray('*', `Analyzing used resolved files [P${principals.indexOf(principal) + 1}/${++round}]`, files);
      for (const filePath of files) {
        analyzeSourceFile(filePath, principal);
      }
    } while (size !== principal.entryPaths.size);

    if (!isIsolateWorkspaces) {
      for (const specifierFilePath of internalWorkspaceFilePaths) analyzeSourceFile(specifierFilePath, principal);
    }

    for (const filePath of principal.getUnreferencedFiles()) unreferencedFiles.add(filePath);
    for (const filePath of principal.entryPaths) entryPaths.add(filePath);

    principal.reconcileCache(serializableMap);

    // Delete principals including TS programs for GC, except when we still need its `LS.findReferences`
    if (!isIsolateWorkspaces && isSkipLibs && !isWatch) factory.deletePrincipal(principal);
  }

  if (isIsolateWorkspaces) {
    // Re-analyze files from local workspaces that were referenced, but have not yet been successfully resolved
    for (const specifierFilePath of internalWorkspaceFilePaths) {
      const workspace = chief.findWorkspaceByFilePath(specifierFilePath);
      if (workspace) {
        const principal = factory.getPrincipalByPackageName(workspace.pkgName);
        if (principal) analyzeSourceFile(specifierFilePath, principal);
      }
    }
    for (const principal of principals) factory.deletePrincipal(principal);
  }

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(serializableMap);

  const getReExportingEntryFile = getReExportingEntryFileHandler(entryPaths, serializableMap);

  const isExportedItemReferenced = (exportedItem: SerializableExport | SerializableExportMember) =>
    exportedItem.refs > 0 &&
    (typeof chief.config.ignoreExportsUsedInFile === 'object'
      ? exportedItem.type !== 'unknown' && !!chief.config.ignoreExportsUsedInFile[exportedItem.type]
      : chief.config.ignoreExportsUsedInFile);

  const findUnusedExports = async () => {
    if (isReportValues || isReportTypes) {
      streamer.cast('Connecting the dots...');

      for (const [filePath, file] of Object.entries(serializableMap)) {
        const exportItems = file.exports?.exported;
        if (!exportItems) continue;
        const workspace = chief.findWorkspaceByFilePath(filePath);
        const principal = workspace && factory.getPrincipalByPackageName(workspace.pkgName);

        if (workspace) {
          const { isIncludeEntryExports } = workspace.config;

          // Bail out when in entry file (unless `isIncludeEntryExports`)
          if (!isIncludeEntryExports && entryPaths.has(filePath)) continue;

          const importsForExport = file.imported;

          for (const [identifier, exportedItem] of Object.entries(exportItems)) {
            // Skip tagged exports
            if (exportedItem.jsDocTags.has('@public') || exportedItem.jsDocTags.has('@beta')) continue;
            if (exportedItem.jsDocTags.has('@alias')) continue;
            if (shouldIgnore(exportedItem.jsDocTags, tags)) continue;
            if (isProduction && exportedItem.jsDocTags.has('@internal')) continue;

            if (importsForExport) {
              if (!isIncludeEntryExports) {
                if (getReExportingEntryFile(importsForExport, identifier, 0, filePath)) continue;
              }

              if (isIdentifierReferenced(filePath, identifier, importsForExport)) {
                if (report.enumMembers && exportedItem.type === 'enum') {
                  for (const member of exportedItem.members) {
                    if (hasMatch(workspace.ignoreMembers, member.identifier)) continue;
                    if (shouldIgnore(member.jsDocTags, tags)) continue;

                    if (member.refs === 0) {
                      if (!isIdentifierReferenced(filePath, `${identifier}.${member.identifier}`, importsForExport)) {
                        collector.addIssue({
                          type: 'enumMembers',
                          filePath,
                          symbol: member.identifier,
                          parentSymbol: identifier,
                          pos: member.pos,
                          line: member.line,
                          col: member.col,
                        });
                      }
                    }
                  }
                }

                if (principal && isReportClassMembers && exportedItem.type === 'class') {
                  const members = exportedItem.members.filter(
                    member =>
                      !(hasMatch(workspace.ignoreMembers, member.identifier) || shouldIgnore(member.jsDocTags, tags))
                  );
                  for (const member of principal.findUnusedMembers(filePath, members)) {
                    collector.addIssue({
                      type: 'classMembers',
                      filePath,
                      symbol: member.identifier,
                      parentSymbol: exportedItem.identifier,
                      pos: member.pos,
                      line: member.line,
                      col: member.col,
                    });
                  }
                }

                // This id was imported, so we bail out early
                continue;
              }
            }

            const [hasStrictlyNsReferences, namespace] = getHasStrictlyNsReferences(importsForExport);

            const isType = ['enum', 'type', 'interface'].includes(exportedItem.type);

            if (hasStrictlyNsReferences && ((!report.nsTypes && isType) || !(report.nsExports || isType))) continue;

            if (!isExportedItemReferenced(exportedItem)) {
              if (!isSkipLibs && principal?.hasReferences(filePath, exportedItem)) continue;

              const type = getType(hasStrictlyNsReferences, isType);
              collector.addIssue({
                type,
                filePath,
                symbol: identifier,
                symbolType: exportedItem.type,
                parentSymbol: namespace,
                pos: exportedItem.pos,
                line: exportedItem.line,
                col: exportedItem.col,
              });
              if (isType) fixer.addUnusedTypeNode(filePath, exportedItem.fixes);
              else fixer.addUnusedExportNode(filePath, exportedItem.fixes);
            }
          }
        }
      }
    }

    for (const [filePath, file] of Object.entries(serializableMap)) {
      if (file.exports?.duplicate) {
        for (const symbols of file.exports.duplicate) {
          if (symbols.length > 1) {
            const symbol = symbols.map(s => s.symbol).join('|');
            collector.addIssue({ type: 'duplicates', filePath, symbol, symbols });
          }
        }
      }

      if (file.imports?.external) {
        const workspace = chief.findWorkspaceByFilePath(filePath);
        if (workspace) {
          for (const specifier of file.imports.external) {
            const packageName = getPackageNameFromModuleSpecifier(specifier);
            const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);
            if (!isHandled) collector.addIssue({ type: 'unlisted', filePath, symbol: specifier });
          }
        }
      }

      if (file.imports?.unresolved) {
        for (const unresolvedImport of file.imports.unresolved) {
          const { specifier, pos, line, col } = unresolvedImport;
          collector.addIssue({ type: 'unresolved', filePath, symbol: specifier, pos, line, col });
        }
      }
    }

    const unusedFiles = [...unreferencedFiles].filter(filePath => !analyzedFiles.has(filePath));

    collector.addFilesIssues(unusedFiles);

    collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });

    if (isReportDependencies) {
      const { dependencyIssues, devDependencyIssues, optionalPeerDependencyIssues } = deputy.settleDependencyIssues();
      const configurationHints = deputy.getConfigurationHints();
      for (const issue of dependencyIssues) collector.addIssue(issue);
      if (!isProduction) for (const issue of devDependencyIssues) collector.addIssue(issue);
      for (const issue of optionalPeerDependencyIssues) collector.addIssue(issue);
      for (const hint of configurationHints) collector.addConfigurationHint(hint);
    }

    const unusedIgnoredWorkspaces = chief.getUnusedIgnoredWorkspaces();
    for (const identifier of unusedIgnoredWorkspaces) {
      collector.addConfigurationHint({ type: 'ignoreWorkspaces', identifier });
    }
  };

  if (isWatch) {
    watch('.', { recursive: true }, async (eventType, filename) => {
      debugLog('*', `(raw) ${eventType} ${filename}`);

      if (filename) {
        const startTime = performance.now();
        const filePath = join(cwd, toPosix(filename));

        if (filename.startsWith(CacheConsultant.getCacheLocation())) return;
        if (isGitIgnored(filePath)) return;

        const workspace = chief.findWorkspaceByFilePath(filePath);
        if (workspace) {
          const principal = factory.getPrincipalByPackageName(workspace.pkgName);
          if (principal) {
            const event = eventType === 'rename' ? (isFile(filePath) ? 'added' : 'deleted') : 'modified';

            principal.invalidateFile(filePath);
            internalWorkspaceFilePaths.clear();
            unreferencedFiles.clear();
            const cachedUnusedFiles = collector.purge();

            switch (event) {
              case 'added':
                principal.addProjectPath(filePath);
                principal.deletedFiles.delete(filePath);
                cachedUnusedFiles.add(filePath);
                debugLog(workspace.name, `Watcher: + ${filename}`);
                break;
              case 'deleted':
                analyzedFiles.delete(filePath);
                principal.removeProjectPath(filePath);
                cachedUnusedFiles.delete(filePath);
                debugLog(workspace.name, `Watcher: - ${filename}`);
                break;
              case 'modified':
                debugLog(workspace.name, `Watcher: ± ${filename}`);
                break;
            }

            const filePaths = principal.getUsedResolvedFiles();

            if (event === 'added' || event === 'deleted') {
              // Flush, any file might contain (un)resolved imports to added/deleted files
              serializableMap = {};
              for (const filePath of filePaths) analyzeSourceFile(filePath, principal);
            } else {
              for (const filePath in serializableMap) {
                if (filePaths.includes(filePath)) {
                  // Reset dep graph
                  serializableMap[filePath].imported = undefined;
                } else {
                  // Remove files no longer referenced
                  delete serializableMap[filePath];
                  analyzedFiles.delete(filePath);
                }
              }

              // Add existing files that were not yet part of the program
              for (const filePath of filePaths) if (!serializableMap[filePath]) analyzeSourceFile(filePath, principal);

              if (!cachedUnusedFiles.has(filePath)) analyzeSourceFile(filePath, principal);

              // Rebuild dep graph
              for (const filePath of filePaths) {
                if (serializableMap[filePath]?.internalImportCache) {
                  // biome-ignore lint/style/noNonNullAssertion: ignore
                  setInternalImports(filePath, serializableMap[filePath].internalImportCache!);
                }
              }
            }

            await findUnusedExports();

            const unusedFiles = [...cachedUnusedFiles].filter(filePath => !analyzedFiles.has(filePath));
            collector.addFilesIssues(unusedFiles);
            collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });

            const { issues } = collector.getIssues();

            watchReporter({ report, issues, streamer, startTime, size: analyzedFiles.size, isDebug });
          }
        }
      }
    });
  }

  await findUnusedExports();

  const { issues, counters, configurationHints } = collector.getIssues();

  if (isFix) {
    await fixer.fixIssues(issues);
  }

  if (isWatch) watchReporter({ report, issues, streamer, size: analyzedFiles.size, isDebug });
  else streamer.clear();

  return { report, issues, counters, rules, configurationHints };
};
