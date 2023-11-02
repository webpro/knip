export enum SymbolType {
  TYPE = 'type',
  INTERFACE = 'interface',
  ENUM = 'enum',
  FUNCTION = 'function',
  CLASS = 'class',
  MEMBER = 'member',
  UNKNOWN = 'unknown',
}

export type Issue = {
  type: SymbolIssueType;
  filePath: string;
  symbol: string;
  symbols?: string[];
  symbolType?: SymbolType;
  parentSymbol?: string;
  severity?: IssueSeverity;
  pos?: number;
  line?: number;
  col?: number;
};

export type IssueSet = Set<string>;

export type IssueRecords = Record<string, Record<string, Issue>>;

export type Issues = {
  files: IssueSet;
  dependencies: IssueRecords;
  devDependencies: IssueRecords;
  optionalPeerDependencies: IssueRecords;
  unlisted: IssueRecords;
  binaries: IssueRecords;
  unresolved: IssueRecords;
  exports: IssueRecords;
  types: IssueRecords;
  nsExports: IssueRecords;
  nsTypes: IssueRecords;
  duplicates: IssueRecords;
  enumMembers: IssueRecords;
  classMembers: IssueRecords;
};

export type IssueType = keyof Issues;

export type SymbolIssueType = Exclude<IssueType, 'files'>;

export type Report = {
  [key in keyof Issues]: boolean;
};

export type Counters = Record<IssueType | 'processed' | 'total', number>;

export type ReporterOptions = {
  report: Report;
  issues: Issues;
  counters: Counters;
  configurationHints: ConfigurationHints;
  noConfigHints: boolean;
  cwd: string;
  isProduction: boolean;
  isShowProgress: boolean;
  options: string;
  preprocessorOptions: string;
};

export type Reporter = (options: ReporterOptions) => void;

export type Preprocessor = (options: ReporterOptions) => ReporterOptions;

export type IssueSeverity = 'error' | 'warn' | 'off';

export type Rules = Record<IssueType, IssueSeverity>;

export type ConfigurationHints = Set<ConfigurationHint>;

export type ConfigurationHint = {
  type: 'ignoreBinaries' | 'ignoreDependencies' | 'ignoreWorkspaces';
  identifier: string;
  workspaceName?: string;
};
