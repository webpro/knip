type Script = string | string[];

type Entry = Script | ((filenames: string[]) => Script | Promise<Script>);

type Config = Record<string, Entry>;

export type LintStagedConfig = Config | (() => Config);
