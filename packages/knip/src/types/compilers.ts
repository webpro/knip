type FileExtension = string;

export type SyncCompilerFn = (source: string, path: string) => string;
export type AsyncCompilerFn = (source: string, path: string) => Promise<string>;

export type SyncCompilers = Map<FileExtension, SyncCompilerFn>;
export type AsyncCompilers = Map<FileExtension, AsyncCompilerFn>;
