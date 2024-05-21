import type ts from 'typescript';

// The members of ts.SourceFile below are added by binding and not public, so we add them here

// Overriding a SymbolTable to use string instead of __String as key (type SymbolTable = UnderscoreEscapedMap<Symbol>)
type SymbolTable = Map<string, ts.Symbol>;

type SymbolWithExports = ts.Symbol & {
  exports?: SymbolTable;
};

type PragmaMap = {
  arguments: {
    factory?: string;
    path?: { value?: string; pos?: number };
    types?: { value?: string; pos?: number };
  };
};

export interface BoundSourceFile extends ts.SourceFile {
  // Used in `maybeAddAliasedExport`
  symbol?: SymbolWithExports;

  // Used in `addImport`, but only available in TypeScript <5.3.0
  resolvedModules?: ts.ModeAwareCache<ts.ResolvedModuleWithFailedLookupLocations>;

  // Used in `maybeAddNamespaceAccessAsImport` (perf only)
  locals?: SymbolTable;

  // Used in `exportDeclaration`
  getNamedDeclarations?(): Map<string, readonly ts.Declaration[]>;

  scriptKind?: ts.ScriptKind;

  pragmas?: Map<string, PragmaMap | PragmaMap[]>;
}
