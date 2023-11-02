import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { getOrSet } from '../util/map.js';
import { isMaybePackageName, sanitizeSpecifier } from '../util/modules.js';
import { isInNodeModules } from '../util/path.js';
import {
  isDeclarationFileExtension,
  isAccessExpression,
  getAccessExpressionName,
  getJSDocTags,
} from './ast-helpers.js';
import getExportVisitors from './visitors/exports/index.js';
import { getJSXImplicitImportBase } from './visitors/helpers.js';
import getImportVisitors from './visitors/imports/index.js';
import getScriptVisitors from './visitors/scripts/index.js';
import type { BoundSourceFile } from './SourceFile.js';
import type { ExportItems as Exports, ExportItem } from '../types/exports.js';
import type { Imports } from '../types/imports.js';

const getVisitors = (sourceFile: ts.SourceFile) => ({
  export: getExportVisitors(sourceFile),
  import: getImportVisitors(sourceFile),
  script: getScriptVisitors(sourceFile),
});

export type GetImportsAndExportsOptions = {
  skipTypeOnly: boolean;
  skipExports: boolean;
};

export type AddImportOptions = {
  specifier: string;
  symbol?: ts.Symbol;
  identifier?: string;
  isReExport?: boolean;
};

type AddInternalImportOptions = AddImportOptions & {
  identifier: string;
  filePath: string;
  isReExport: boolean;
};

export type AddExportOptions = ExportItem & { identifier: string };

export const getImportsAndExports = (sourceFile: BoundSourceFile, options: GetImportsAndExportsOptions) => {
  const internalImports: Imports = new Map();
  const externalImports: Set<string> = new Set();
  const unresolvedImports: Set<string> = new Set();
  const exports: Exports = new Map();
  const aliasedExports: Record<string, string[]> = {};
  const scripts: Set<string> = new Set();

  const importedInternalSymbols: Map<ts.Symbol, string> = new Map();

  // No file-level visitors yet, so let's keep it simple
  const jsxImport = getJSXImplicitImportBase(sourceFile);
  if (jsxImport) externalImports.add(jsxImport);

  const visitors = getVisitors(sourceFile);

  const addInternalImport = (options: AddInternalImportOptions) => {
    const { identifier, specifier, symbol, filePath, isReExport } = options;

    const isStar = identifier === '*';

    const internalImport = getOrSet(internalImports, filePath, {
      specifier,
      isStar,
      isReExport,
      isReExportedBy: new Set(),
      symbols: new Set(),
    });

    if (isReExport) {
      internalImport.isReExport = isReExport;
      internalImport.isReExportedBy.add(sourceFile.fileName);
    }

    if (isStar) internalImport.isStar = isStar;

    if (!isStar) internalImport.symbols.add(identifier);

    // Store imported namespace symbol for reference in `maybeAddNamespaceAccessAsImport`
    if (isStar && symbol) importedInternalSymbols.set(symbol, filePath);
  };

  const addImport = (options: AddImportOptions) => {
    const { specifier, symbol, identifier = '__anonymous', isReExport = false } = options;
    if (isBuiltin(specifier)) return;

    const module = sourceFile.resolvedModules?.get(specifier, /* mode */ undefined);

    if (module?.resolvedModule) {
      const filePath = module.resolvedModule.resolvedFileName;
      if (filePath) {
        if (module.resolvedModule.isExternalLibraryImport) {
          if (!isInNodeModules(filePath)) {
            addInternalImport({ identifier, specifier, symbol, filePath, isReExport });
          }

          const sanitizedSpecifier = sanitizeSpecifier(specifier);
          if (!isMaybePackageName(sanitizedSpecifier)) return;

          if (isDeclarationFileExtension(module.resolvedModule.extension)) {
            // We use TypeScript's module resolution, but it returns DTS references. In the rest of the program we want
            // the package name based on the original specifier.
            externalImports.add(sanitizedSpecifier);
          } else {
            externalImports.add(module.resolvedModule.packageId?.name ?? sanitizedSpecifier);
          }
        } else {
          addInternalImport({ identifier, specifier, symbol, filePath, isReExport });
        }
      }
    } else {
      unresolvedImports.add(specifier);
    }
  };

  /**
   * Perhaps odd to try this for every obj.prop access, but it's cheaper to pretend `import * as NS from 'mod';
   * NS.exportValue` was imported as `exportValue` directly. Otherwise we have to find references to `exportValue`
   * across the program later on. More namespaces, more gains, easily up to ~10% in total running time.
   */
  const maybeAddNamespaceAccessAsImport = ({ namespace, member }: { namespace: string; member: string }) => {
    const symbol = sourceFile.locals?.get(namespace);
    if (symbol) {
      const importedSymbolFilePath = importedInternalSymbols.get(symbol);
      if (importedSymbolFilePath) {
        const internalImport = internalImports.get(importedSymbolFilePath);
        // The referenced imported namespace member is the exported identifier
        internalImport?.symbols.add(member);
      }
    }
  };

  const addExport = ({ node, identifier, type, pos, members = [] }: AddExportOptions) => {
    if (options.skipExports) return;

    const jsDocTags = getJSDocTags(node);

    if (exports.has(identifier)) {
      const item = exports.get(identifier)!;
      const crew = [...item.members, ...members];
      const tags = new Set([...item.jsDocTags, ...jsDocTags]);
      exports.set(identifier, { ...item, members: crew, jsDocTags: tags });
    } else {
      exports.set(identifier, { node, type, members, jsDocTags, pos });
    }

    if (!jsDocTags.has('@alias')) {
      if (ts.isExportAssignment(node)) maybeAddAliasedExport(node.expression, 'default');
      if (ts.isVariableDeclaration(node)) maybeAddAliasedExport(node.initializer, identifier);
    }
  };

  const maybeAddAliasedExport = (node: ts.Expression | undefined, alias: string) => {
    const identifier = node?.getText();
    if (identifier && sourceFile.symbol?.exports?.has(identifier)) {
      aliasedExports[identifier] = aliasedExports[identifier] ?? [identifier];
      aliasedExports[identifier].push(alias);
    }
  };

  const visit = (node: ts.Node) => {
    for (const visitor of visitors.import) {
      if (visitor) {
        const results = visitor(node, options);
        if (results) [results].flat().forEach(addImport);
      }
    }

    for (const visitor of visitors.export) {
      if (visitor) {
        const results = visitor(node, options);
        if (results) [results].flat().forEach(addExport);
      }
    }

    for (const visitor of visitors.script) {
      if (visitor) {
        const results = visitor(node, options);
        if (results) [results].flat().forEach(script => scripts.add(script));
      }
    }

    if (isAccessExpression(node)) {
      maybeAddNamespaceAccessAsImport({
        namespace: node.expression.getText(),
        member: getAccessExpressionName(node),
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return {
    imports: {
      internal: internalImports,
      external: externalImports,
      unresolved: unresolvedImports,
    },
    exports: {
      exported: exports,
      duplicate: Object.values(aliasedExports),
    },
    scripts,
  };
};
