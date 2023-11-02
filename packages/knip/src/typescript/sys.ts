import ts from 'typescript';
import { ensureRealFilePath } from './utils.js';

export function createCustomSys(cwd: string, virtualFileExtensions: string[]) {
  const sys = {
    ...ts.sys,
    getCurrentDirectory: () => cwd,
  };

  if (virtualFileExtensions.length === 0) return sys;

  return {
    ...sys,
    fileExists(path: string) {
      return ts.sys.fileExists(ensureRealFilePath(path, virtualFileExtensions));
    },
  };
}
