import { isGitIgnoredSync } from 'globby';
import ts from 'typescript';
import { DEFAULT_EXTENSIONS } from './constants.js';
import { IGNORED_FILE_EXTENSIONS } from './constants.js';
import { getJSDocTags, getLineAndCharacterOfPosition, isInModuleBlock } from './typescript/ast-helpers.js';
import { createHosts } from './typescript/createHosts.js';
import { getImportsAndExports } from './typescript/getImportsAndExports.js';
import { createCustomModuleResolver } from './typescript/resolveModuleNames.js';
import { SourceFileManager } from './typescript/SourceFileManager.js';
import { isMaybePackageName, sanitizeSpecifier } from './util/modules.js';
import { dirname, extname, isInNodeModules, join } from './util/path.js';
import { timerify } from './util/Performance.js';
import type { SyncCompilers, AsyncCompilers } from './types/compilers.js';
import type { ExportItem, ExportItemMember } from './types/exports.js';

type ProjectPrincipalOptions = {
  compilerOptions: ts.CompilerOptions;
  cwd: string;
  compilers: [SyncCompilers, AsyncCompilers];
};

// These compiler options override local options
const baseCompilerOptions = {
  allowJs: true,
  jsx: ts.JsxEmit.Preserve,
  jsxImportSource: undefined,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  lib: [],
  target: ts.ScriptTarget.Latest,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
};

const tsCreateProgram = timerify(ts.createProgram);

/**
 * This class aims to abstract away TypeScript specific things from the main flow.
 *
 * - Provided by the principal factory
 * - Collects entry and project paths
 * - Installs TS backend: file manager, language and compiler hosts for the TS program
 * - Creates TS program and typechecker
 * - Run async compilers ahead of time since the TS machinery is fully sync
 * - Bridge between main flow and TS AST walker
 */
export class ProjectPrincipal {
  // Configured by user and returned from plugins
  entryPaths: Set<string> = new Set();
  projectPaths: Set<string> = new Set();

  // We don't want to report unused exports of config/plugin entry files
  skipExportsAnalysis: Set<string> = new Set();

  isGitIgnored: ReturnType<typeof isGitIgnoredSync>;
  cwd: string;
  compilerOptions: ts.CompilerOptions;
  extensions: Set<string>;
  syncCompilers: SyncCompilers;
  asyncCompilers: AsyncCompilers;

  backend: {
    fileManager: SourceFileManager;
    compilerHost: ts.CompilerHost;
    resolveModuleNames: ReturnType<typeof createCustomModuleResolver>;
    lsFindReferences: ts.LanguageService['findReferences'];
    program?: ts.Program;
  };

  constructor({ compilerOptions, cwd, compilers }: ProjectPrincipalOptions) {
    this.cwd = cwd;

    // Provide `cwd`, otherwise defaults to process.cwd() w/ incompatible slashes in Windows
    this.isGitIgnored = isGitIgnoredSync({ cwd });

    this.compilerOptions = {
      ...compilerOptions,
      ...baseCompilerOptions,
      allowNonTsExtensions: [...compilers].flat().length > 0,
    };

    const [syncCompilers, asyncCompilers] = compilers;
    this.extensions = new Set([...DEFAULT_EXTENSIONS, ...syncCompilers.keys(), ...asyncCompilers.keys()]);
    this.syncCompilers = syncCompilers;
    this.asyncCompilers = asyncCompilers;

    const { fileManager, compilerHost, languageServiceHost, resolveModuleNames } = createHosts({
      cwd: this.cwd,
      compilerOptions: this.compilerOptions,
      entryPaths: this.entryPaths,
      compilers: [this.syncCompilers, this.asyncCompilers],
    });

    const languageService = ts.createLanguageService(languageServiceHost, ts.createDocumentRegistry());

    const lsFindReferences = timerify(languageService?.findReferences);

    this.backend = {
      fileManager,
      compilerHost,
      resolveModuleNames,
      lsFindReferences,
    };
  }

  /**
   * `ts.createProgram()` resolves files starting from the provided entry/root files. Calling `program.getTypeChecker()`
   * binds files and symbols (including symbols and maps like `sourceFile.resolvedModules` and `sourceFile.symbols`)
   */
  private createProgram() {
    this.backend.program = tsCreateProgram(
      Array.from(this.entryPaths),
      this.compilerOptions,
      this.backend.compilerHost,
      this.backend.program
    );

    const typeChecker = timerify(this.backend.program.getTypeChecker);
    typeChecker();
  }

  private hasAcceptedExtension(filePath: string) {
    return this.extensions.has(extname(filePath));
  }

  public addEntryPath(filePath: string, options?: { skipExportsAnalysis: boolean }) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.entryPaths.add(filePath);
      this.projectPaths.add(filePath);
      if (options?.skipExportsAnalysis) this.skipExportsAnalysis.add(filePath);
    }
  }

  public addEntryPaths(filePaths: Set<string> | string[], options?: { skipExportsAnalysis: boolean }) {
    filePaths.forEach(filePath => this.addEntryPath(filePath, options));
  }

  public addProjectPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.projectPaths.add(filePath);
    }
  }

  /**
   * Compile files with async compilers _before_ `ts.createProgram()`, since the TypeScript hosts machinery is fully
   * synchronous (eg. `ts.sys.readFile` and `host.resolveModuleNames`)
   */
  public async runAsyncCompilers() {
    const add = timerify(this.backend.fileManager.compileAndAddSourceFile.bind(this.backend.fileManager));
    const extensions = Array.from(this.asyncCompilers.keys());
    const files = Array.from(this.projectPaths).filter(filePath => extensions.includes(extname(filePath)));
    for (const filePath of files) {
      await add(filePath);
    }
  }

  public getUsedResolvedFiles() {
    this.createProgram();
    const sourceFiles = this.getProgramSourceFiles();
    return Array.from(this.projectPaths).filter(filePath => sourceFiles.has(filePath));
  }

  private getProgramSourceFiles() {
    const programSourceFiles = this.backend.program?.getSourceFiles().map(sourceFile => sourceFile.fileName);
    return new Set(programSourceFiles);
  }

  public getUnreferencedFiles() {
    const sourceFiles = this.getProgramSourceFiles();
    return Array.from(this.projectPaths).filter(filePath => !sourceFiles.has(filePath));
  }

  public analyzeSourceFile(filePath: string, { skipTypeOnly }: { skipTypeOnly: boolean }) {
    // We request it from `fileManager` directly as `program` does not contain cross-referenced files
    const sourceFile = this.backend.fileManager.getSourceFile(filePath);

    if (!sourceFile) throw new Error(`Unable to find ${filePath}`);

    const skipExports = this.skipExportsAnalysis.has(filePath);

    const { imports, exports, scripts } = getImportsAndExports(sourceFile, { skipTypeOnly, skipExports });

    const { internal, unresolved, external } = imports;

    const unresolvedImports: Set<string> = new Set();

    unresolved.forEach(specifier => {
      if (specifier.startsWith('http')) {
        // Ignore Deno style http import specifiers.
        return;
      }
      const resolvedModule = this.resolveModule(specifier, filePath);
      if (resolvedModule) {
        if (resolvedModule.isExternalLibraryImport) {
          external.add(specifier);
        } else {
          this.addEntryPath(resolvedModule.resolvedFileName, { skipExportsAnalysis: true });
        }
      } else {
        const sanitizedSpecifier = sanitizeSpecifier(specifier);
        if (isMaybePackageName(sanitizedSpecifier)) {
          // Should never end up here; maybe a dependency that was not installed.
          // Package name may contain such extensions, but any external dependency should be resolved by TS.
          external.add(sanitizedSpecifier);
        } else {
          const isIgnored = this.isGitIgnored(join(dirname(filePath), sanitizedSpecifier));
          if (!isIgnored) {
            const ext = extname(sanitizedSpecifier);
            const hasIgnoredExtension = IGNORED_FILE_EXTENSIONS.includes(ext);
            if (!ext || (ext !== '.json' && !hasIgnoredExtension)) {
              unresolvedImports.add(specifier);
            }
          }
        }
      }
    });

    return {
      imports: {
        internal,
        unresolved: unresolvedImports,
        external,
      },
      exports,
      scripts,
    };
  }

  public resolveModule(specifier: string, filePath: string = specifier) {
    return this.backend.resolveModuleNames([specifier], filePath)[0];
  }

  public getHasReferences(filePath: string, exportedItem: ExportItem) {
    const hasReferences = { external: false, internal: false };

    const symbolReferences = this.findReferences(filePath, exportedItem.pos).flatMap(f => f.references);

    for (const reference of symbolReferences) {
      if (reference.fileName === filePath) {
        if (!reference.isDefinition) {
          hasReferences.internal = true;
        }
      } else {
        hasReferences.external = true;
      }
    }

    if (!hasReferences.external && hasReferences.internal) {
      // Consider exports in module blocks (namespaces) referenced in the same file as external refs
      // Pattern: namespace NS { export type T }; type U = NS.T;
      hasReferences.external = isInModuleBlock(exportedItem.node);
    }

    return hasReferences;
  }

  public findUnusedMembers(filePath: string, members: ExportItemMember[]) {
    return members.filter(member => {
      if (getJSDocTags(member.node).has('@public')) return false;
      const referencedSymbols = this.findReferences(filePath, member.pos);
      const files = referencedSymbols
        .flatMap(refs => refs.references)
        .filter(ref => !ref.isDefinition)
        .map(ref => ref.fileName);
      const internalRefs = files.filter(f => f === filePath);
      const externalRefs = files.filter(f => f !== filePath);
      return externalRefs.length === 0 && internalRefs.length === 0;
    });
  }

  private findReferences(filePath: string, pos: number) {
    try {
      return this.backend.lsFindReferences(filePath, pos) ?? [];
    } catch {
      // TS throws for (cross-referenced) files not in the program
      return [];
    }
  }

  public getPos(node: ts.Node, pos: number) {
    const { line, character } = getLineAndCharacterOfPosition(node, pos);
    return { pos, line: line + 1, col: character + 1 };
  }
}
