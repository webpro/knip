export interface CommandLineOptions {
  cwd: string;
  tsConfigFile?: string;
  gitignore: boolean;
  isStrict: boolean;
  isProduction: boolean;
  isIgnoreInternal: boolean;
  isShowProgress: boolean;
  isIncludeEntryExports: boolean;
}
