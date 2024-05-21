import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { ANONYMOUS, DEFAULT_EXTENSIONS } from '../constants.js';
import type { Tags } from '../types/cli.js';
import type { ExportNode, ExportNodeMember } from '../types/exports.js';
import type { ImportNode } from '../types/imports.js';
import type { IssueSymbol } from '../types/issues.js';
import type {
  SerializableExport,
  SerializableExportMember,
  SerializableExports,
  SerializableImportMap,
  UnresolvedImport,
} from '../types/serializable-map.js';
import { timerify } from '../util/Performance.js';
import { isStartsLikePackageName, sanitizeSpecifier } from '../util/modules.js';
import { extname, isInNodeModules } from '../util/path.js';
import { shouldIgnore } from '../util/tag.js';
import type { BoundSourceFile } from './SourceFile.js';
import {
  getAccessMembers,
  getDestructuredIds,
  getJSDocTags,
  getLineAndCharacterOfPosition,
  isAccessExpression,
  isConsiderReferencedNS,
  isDestructuring,
} from './ast-helpers.js';
import getDynamicImportVisitors from './visitors/dynamic-imports/index.js';
import getExportVisitors from './visitors/exports/index.js';
import { getImportsFromPragmas } from './visitors/helpers.js';
import getImportVisitors from './visitors/imports/index.js';
import getScriptVisitors from './visitors/scripts/index.js';

const getVisitors = (sourceFile: ts.SourceFile) => ({
  export: getExportVisitors(sourceFile),
  import: getImportVisitors(sourceFile),
  dynamicImport: getDynamicImportVisitors(sourceFile),
  script: getScriptVisitors(sourceFile),
});

const createSerializableMember = (node: ts.Node, member: ExportNodeMember, pos: number): SerializableExportMember => {
  const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
  return {
    // @ts-expect-error ref will be unset later
    symbol: member.node.symbol,
    identifier: member.identifier,
    type: member.type,
    pos: member.pos,
    line: line + 1,
    col: character + 1,
    fix: member.fix,
    refs: 0,
    jsDocTags: getJSDocTags(member.node),
  };
};

export type GetImportsAndExportsOptions = {
  skipTypeOnly: boolean;
  skipExports: boolean;
  isFixExports: boolean;
  isFixTypes: boolean;
  isReportClassMembers: boolean;
  ignoreExportsUsedInFile: boolean;
  tags: Tags;
};

interface AddInternalImportOptions extends ImportNode {
  namespace?: string;
  identifier: string;
  filePath: string;
  isReExport: boolean;
}

const getImportsAndExports = (
  sourceFile: BoundSourceFile,
  resolveModule: (specifier: string) => ts.ResolvedModuleFull | undefined,
  typeChecker: ts.TypeChecker,
  options: GetImportsAndExportsOptions
) => {
  const { skipTypeOnly, tags } = options;
  const internalImports: SerializableImportMap = {};
  const externalImports = new Set<string>();
  const unresolvedImports = new Set<UnresolvedImport>();
  const resolved = new Set<string>();
  const exports: SerializableExports = {};
  const aliasedExports = new Map<string, IssueSymbol[]>();
  const scripts = new Set<string>();

  const importedInternalSymbols = new Map<ts.Symbol, string>();

  const visitors = getVisitors(sourceFile);

  const addInternalImport = (options: AddInternalImportOptions) => {
    const { identifier, symbol, filePath, namespace, specifier, isReExport } = options;

    const isStar = identifier === '*';

    // biome-ignore lint/suspicious/noAssignInExpressions: TODO
    const imports = (internalImports[filePath] = internalImports[filePath] ?? {
      specifier,
      reExportedBy: new Map(),
      reExportedAs: new Map(),
      reExportedNs: new Map(),
      imported: new Set(),
      importedAs: new Set(),
      importedNs: new Set(),
      refs: new Set(),
    });

    if (isReExport) {
      if (isStar && namespace) {
        // export * as NS from 'specifier';
        if (imports.reExportedNs.has(namespace)) {
          imports.reExportedNs.get(namespace)?.add(sourceFile.fileName);
        } else {
          imports.reExportedNs.set(namespace, new Set([sourceFile.fileName]));
        }
      } else if (namespace) {
        // export { id as alias } from 'specifier';
        if (imports.reExportedAs.has(identifier)) {
          imports.reExportedAs.get(identifier)?.add([namespace, sourceFile.fileName]);
        } else {
          imports.reExportedAs.set(identifier, new Set([[namespace, sourceFile.fileName]]));
        }
      } else {
        // export { id } from 'specifier';
        // export * from 'specifier';
        if (imports.reExportedBy.has(identifier)) {
          imports.reExportedBy.get(identifier)?.add(sourceFile.fileName);
        } else {
          imports.reExportedBy.set(identifier, new Set([sourceFile.fileName]));
        }
      }
    }

    const alias = symbol ? String(symbol.escapedName) : options.alias;
    if (alias && alias !== identifier) {
      if (isStar) {
        imports.importedNs.add(alias);
      } else {
        imports.importedAs.add([identifier, alias]);
      }
    } else if (identifier !== ANONYMOUS && identifier !== '*') {
      imports.imported.add(identifier);
    }

    if (symbol && DEFAULT_EXTENSIONS.includes(extname(sourceFile.fileName))) {
      importedInternalSymbols.set(symbol, filePath);
    }
  };

  const addImport = (options: ImportNode, node: ts.Node) => {
    const { specifier, isTypeOnly, pos, identifier = ANONYMOUS, isReExport = false } = options;
    if (isBuiltin(specifier)) return;

    const module = resolveModule(specifier);

    if (module) {
      const filePath = module.resolvedFileName;
      if (filePath) {
        if (options.resolve) {
          resolved.add(filePath);
          return;
        }

        if (!isInNodeModules(filePath)) {
          addInternalImport({ ...options, identifier, filePath, isReExport });
        }

        if (module.isExternalLibraryImport) {
          if (skipTypeOnly && isTypeOnly) return;

          const sanitizedSpecifier = sanitizeSpecifier(specifier);
          if (!isStartsLikePackageName(sanitizedSpecifier)) {
            // Import maps and other exceptions, examples from tests: #dep, #internals/used, $app/stores
            return;
          }

          // Module resolver may return DTS references or unaliased npm package names,
          // but in the rest of the program we want the package name based on the original specifier.
          externalImports.add(sanitizedSpecifier);
        } else {
          addInternalImport({ ...options, identifier, filePath, isReExport });
        }
      }
    } else {
      if (skipTypeOnly && isTypeOnly) return;
      if (shouldIgnore(getJSDocTags(node), tags)) return;

      if (typeof pos === 'number') {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
        unresolvedImports.add({ specifier, pos, line: line + 1, col: character + 1 });
      } else {
        unresolvedImports.add({ specifier });
      }
    }
  };

  const maybeAddAccessExpressionAsNsImport = (namespace: string, member: string | string[]) => {
    const symbol = sourceFile.locals?.get(namespace);
    if (symbol) {
      const importedSymbolFilePath = importedInternalSymbols.get(symbol);
      if (importedSymbolFilePath) {
        const internalImport = internalImports[importedSymbolFilePath];
        if (typeof member === 'string') internalImport.refs.add(`${namespace}.${member}`);
        else for (const m of member) internalImport.refs.add(`${namespace}.${m}`);
      }
    }
  };

  const addExport = ({ node, symbol, identifier, type, pos, members = [], fix }: ExportNode) => {
    if (options.skipExports) return;

    const isExportSpecifier = ts.isExportSpecifier(node);
    const isExportAssignment = ts.isExportAssignment(node);

    if (isExportSpecifier || isExportAssignment) {
      // Re-exports are handled in import visitors (because module resolution),
      // but in other export declarations we can't (easily) get the imported symbol for pseudo re-exports
      if (isExportSpecifier && node.propertyName) {
        // TODO Tried to sort it out in visitors/exports/exportDeclaration.ts,
        // but seems we need `typeChecker.getSymbolAtLocation` which isn't available over there
        const symbol = typeChecker.getSymbolAtLocation(node.propertyName);
        if (symbol) {
          const importedSymbolFilePath = importedInternalSymbols.get(symbol);
          if (importedSymbolFilePath) {
            const internalImport = internalImports[importedSymbolFilePath];
            if (symbol.declarations && ts.isNamespaceImport(symbol.declarations[0])) {
              // import { id } from 'specifier';
              // export { id }
              if (internalImport.reExportedNs.has(identifier)) {
                internalImport.reExportedNs.get(identifier)?.add(sourceFile.fileName);
              } else {
                internalImport.reExportedNs.set(identifier, new Set([sourceFile.fileName]));
              }
            } else {
              const identifier = String(symbol.escapedName);
              if (internalImport.reExportedAs.has(identifier)) {
                internalImport.reExportedAs.get(identifier)?.add([node.name.getText(), sourceFile.fileName]);
              } else {
                internalImport.reExportedAs.set(identifier, new Set([[node.name.getText(), sourceFile.fileName]]));
              }
            }
          }
        }
      } else if (symbol) {
        const importedSymbolFilePath = importedInternalSymbols.get(symbol);
        if (importedSymbolFilePath) {
          const internalImport = internalImports[importedSymbolFilePath];
          if (isExportAssignment) {
            // import { id } from 'specifier';
            // export = id
            const identifier = String(symbol.escapedName);
            if (internalImport.reExportedAs.has(identifier)) {
              internalImport.reExportedAs.get(identifier)?.add(['default', sourceFile.fileName]);
            } else {
              internalImport.reExportedAs.set(identifier, new Set([['default', sourceFile.fileName]]));
            }
          } else {
            // import * as NS from './3-branch';
            // export { NS };
            const identifier = String(symbol.escapedName);
            if (internalImport.reExportedNs.has(identifier)) {
              internalImport.reExportedNs.get(identifier)?.add(sourceFile.fileName);
            } else {
              internalImport.reExportedNs.set(identifier, new Set([sourceFile.fileName]));
            }
          }
        }
      }
    }

    const jsDocTags = getJSDocTags(node);

    const serializedMembers = members.map(member => createSerializableMember(node, member, member.pos));

    if (exports[identifier]) {
      const item = exports[identifier];
      const members = [...(item.members ?? []), ...serializedMembers];
      const tags = new Set([...(item.jsDocTags ?? []), ...jsDocTags]);
      const fixes = fix ? [...(item.fixes ?? []), fix] : item.fixes;
      exports[identifier] = { ...item, members, jsDocTags: tags, fixes };
    } else {
      const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
      exports[identifier] = {
        identifier,
        // @ts-expect-error ref will be unset later
        symbol: node.symbol,
        type,
        members: serializedMembers,
        jsDocTags,
        pos,
        line: line + 1,
        col: character + 1,
        fixes: fix ? [fix] : [],
        refs: 0,
      };
    }

    if (!jsDocTags.has('@alias')) {
      if (ts.isExportAssignment(node)) maybeAddAliasedExport(node.expression, 'default');
      if (ts.isVariableDeclaration(node)) maybeAddAliasedExport(node.initializer, identifier);
    }
  };

  const addScript = (script: string) => scripts.add(script);

  const maybeAddAliasedExport = (node: ts.Expression | undefined, alias: string) => {
    const identifier = node?.getText();
    if (node && identifier) {
      const symbol = sourceFile.symbol?.exports?.get(identifier);
      if (symbol?.valueDeclaration) {
        if (!aliasedExports.has(identifier)) {
          const pos = getLineAndCharacterOfPosition(symbol.valueDeclaration, symbol.valueDeclaration.pos);
          aliasedExports.set(identifier, [{ symbol: identifier, ...pos }]);
        }
        const aliasedExport = aliasedExports.get(identifier);
        if (aliasedExport) {
          const pos = getLineAndCharacterOfPosition(node, node.pos);
          aliasedExport.push({ symbol: alias, ...pos });
        }
      }
    }
  };

  const visit = (node: ts.Node) => {
    const addImportWithNode = (result: ImportNode) => addImport(result, node);

    for (const visitor of visitors.dynamicImport) {
      const result = visitor(node, options);
      result && (Array.isArray(result) ? result.forEach(addImportWithNode) : addImportWithNode(result));
    }

    // Skip some work by handling only top-level import/export assignments
    const isTopLevel = node.parent === sourceFile || node.parent?.parent === sourceFile;

    if (isTopLevel) {
      for (const visitor of visitors.import) {
        const result = visitor(node, options);
        result && (Array.isArray(result) ? result.forEach(addImportWithNode) : addImportWithNode(result));
      }

      for (const visitor of visitors.export) {
        const result = visitor(node, options);
        result && (Array.isArray(result) ? result.forEach(addExport) : addExport(result));
      }
    }

    for (const visitor of visitors.script) {
      const result = visitor(node, options);
      result && (Array.isArray(result) ? result.forEach(addScript) : addScript(result));
    }

    if (ts.isIdentifier(node)) {
      const symbol = sourceFile.locals?.get(String(node.escapedText));
      if (symbol) {
        const importedSymbolFilePath = importedInternalSymbols.get(symbol);
        if (importedSymbolFilePath) {
          if (
            !ts.isImportSpecifier(node.parent) &&
            !ts.isImportEqualsDeclaration(node.parent) &&
            !ts.isImportClause(node.parent) &&
            !ts.isNamespaceImport(node.parent)
          ) {
            if (
              (!internalImports[importedSymbolFilePath].importedNs.has(String(node.escapedText)) &&
                !internalImports[importedSymbolFilePath].imported.has(String(node.escapedText))) ||
              isConsiderReferencedNS(node)
            ) {
              internalImports[importedSymbolFilePath].refs.add(String(node.escapedText));
            }

            if (isAccessExpression(node.parent)) {
              if (isDestructuring(node.parent)) {
                if (ts.isPropertyAccessExpression(node.parent)) {
                  // Pattern: const { a, b } = NS.sub;
                  const ns = String(symbol.escapedName);
                  const key = String(node.parent.name.escapedText);
                  // @ts-expect-error safe after isDestructuring
                  const members = getDestructuredIds(node.parent.parent.name).map(n => `${key}.${n}`);
                  maybeAddAccessExpressionAsNsImport(ns, key);
                  maybeAddAccessExpressionAsNsImport(ns, members);
                }
              } else {
                // Patterns: NS.id, NS['id'], NS.sub.id, NS[type], etc.
                const members = getAccessMembers(typeChecker, node);
                maybeAddAccessExpressionAsNsImport(String(node.escapedText), members);
              }
            } else if (isDestructuring(node)) {
              // Pattern: const { a, b } = NS;
              // @ts-expect-error safe after isDestructuring
              const members = getDestructuredIds(node.parent.name);
              maybeAddAccessExpressionAsNsImport(String(node.escapedText), members);
            }
          }
        }
      }
    }

    if (
      isTopLevel &&
      ts.isImportEqualsDeclaration(node) &&
      ts.isQualifiedName(node.moduleReference) &&
      ts.isIdentifier(node.moduleReference.left)
    ) {
      // Pattern: import name = NS.identifier
      const { left, right } = node.moduleReference;
      if (sourceFile.locals?.get(left.text)) maybeAddAccessExpressionAsNsImport(left.text, right.text);
    }

    if (ts.isTypeReferenceNode(node) && ts.isQualifiedName(node.typeName)) {
      const [ns, ...right] = [node.typeName.left.getText(), node.typeName.right.getText()].join('.').split('.');
      const members = right.map((_r, index) => right.slice(0, index + 1).join('.'));
      maybeAddAccessExpressionAsNsImport(ns, members);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  // No file-level visitors yet, so let's keep it simple
  const pragmaImports = getImportsFromPragmas(sourceFile);
  if (pragmaImports) for (const node of pragmaImports) addImport(node, sourceFile);

  const setRefs = (item: SerializableExport | SerializableExportMember) => {
    if (!item.symbol) return;
    const symbols = new Set<ts.Symbol>();
    for (const match of sourceFile.text.matchAll(new RegExp(item.identifier.replace(/\$/g, '\\$'), 'g'))) {
      const isDeclaration = match.index === item.pos || match.index === item.pos + 1; // off-by-one from `stripQuotes`
      if (!isDeclaration) {
        // @ts-expect-error ts.getTokenAtPosition is internal fn
        const symbol = typeChecker.getSymbolAtLocation(ts.getTokenAtPosition(sourceFile, match.index));
        if (symbol) {
          if (item.symbol === symbol) {
            item.refs = 1;
            break;
          }
          // @ts-expect-error Keep it cheap
          const declaration = symbol.declarations?.[0];
          if (declaration) {
            if (item.symbol === declaration.name?.flowNode?.node?.symbol) {
              item.refs = 1;
              break;
            }
            if (ts.isImportSpecifier(declaration) && symbols.has(symbol)) {
              // re-exported symbol is referenced
              item.refs = 1;
              break;
            }
          }
          symbols.add(symbol);
        }
      }
    }
  };

  for (const key in exports) {
    const item = exports[key];
    if (options.ignoreExportsUsedInFile) setRefs(item);
    for (const member of item.members) {
      setRefs(member);
      member.symbol = undefined;
    }
    item.symbol = undefined;
  }

  return {
    imports: {
      internal: internalImports,
      external: externalImports,
      resolved,
      unresolved: unresolvedImports,
    },
    exports: {
      exported: exports,
      duplicate: [...aliasedExports.values()],
    },
    scripts,
  };
};

export const _getImportsAndExports = timerify(getImportsAndExports);
