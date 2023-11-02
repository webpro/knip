type Config = {
  files?: string[];
  require?: string[];
  nodeArguments?: string[];
  extensions?: string[];
};

export type AvaConfig = Config | (() => Config);
