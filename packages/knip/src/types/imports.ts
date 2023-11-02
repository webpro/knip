type FilePath = string;
type Specifier = string;
type Identifier = string;

type ImportItems = Set<Identifier>;

export type ImportedModule = {
  specifier: Specifier;
  symbols: ImportItems;
  isStar: boolean;
  isReExport: boolean;
  isReExportedBy: Set<string>;
};

export type Imports = Map<FilePath, ImportedModule>;
