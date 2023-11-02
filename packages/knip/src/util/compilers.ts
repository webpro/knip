import type { AsyncCompilerFn, SyncCompilerFn } from '../types/compilers.js';
import type { RawConfiguration } from '../types/config.js';

// TODO This does not detect functions returning a promise (just the async keyword)
const isAsync = (fn?: SyncCompilerFn | AsyncCompilerFn) => (fn ? fn.constructor.name === 'AsyncFunction' : false);

const normalizeExt = (ext: string) => ext.replace(/^\.*/, '.');

export const partitionCompilers = (rawLocalConfig: RawConfiguration) => {
  const syncCompilers: Record<string, SyncCompilerFn> = {};
  const asyncCompilers: Record<string, AsyncCompilerFn> = {};

  for (const extension in rawLocalConfig.compilers) {
    const ext = normalizeExt(extension);
    if (!rawLocalConfig.asyncCompilers?.[ext] && isAsync(rawLocalConfig.compilers[extension])) {
      asyncCompilers[ext] = rawLocalConfig.compilers[extension] as AsyncCompilerFn;
    } else {
      syncCompilers[ext] = rawLocalConfig.compilers[extension] as SyncCompilerFn;
    }
  }

  for (const extension in rawLocalConfig.asyncCompilers) {
    const ext = normalizeExt(extension);
    asyncCompilers[ext] = rawLocalConfig.asyncCompilers[extension] as AsyncCompilerFn;
  }

  return { ...rawLocalConfig, syncCompilers, asyncCompilers };
};
