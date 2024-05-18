import fastGlob from 'fast-glob';
import type { CompilerOptions } from 'typescript';
import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { debugLog } from './debug.js';
import { isDirectory } from './fs.js';
import { isInternal, join, toRelative } from './path.js';

export type ToSourceFilePath = (filePath: string) => undefined | string;

const defaultExtensions = `.{${DEFAULT_EXTENSIONS.map(ext => ext.slice(1)).join(',')}}`;
const hasJSExt = /\.(m|c)js$/;
const hasTSExt = /(?<!\.d)\.(m|c)?tsx?$/;
const matchExt = /(\.d)?\.(m|c)?(j|t)s$/;

export const augmentWorkspace = (workspace: Workspace, dir: string, compilerOptions: CompilerOptions) => {
  const srcDir = join(dir, 'src');
  workspace.srcDir = compilerOptions.rootDir ?? isDirectory(srcDir) ? srcDir : dir;
  workspace.outDir = compilerOptions.outDir || workspace.srcDir;
};

export const getToSourcePathHandler = (chief: ConfigurationChief) => {
  const toSourceMapCache = new Map<string, string>();

  const toSourcePath: ToSourceFilePath = (filePath: string) => {
    if (!isInternal(filePath) || hasJSExt.test(filePath) || hasTSExt.test(filePath)) return;
    if (toSourceMapCache.has(filePath)) return toSourceMapCache.get(filePath);
    const workspace = chief.findWorkspaceByFilePath(filePath);
    if (workspace) {
      if (workspace.srcDir && workspace.outDir) {
        if (filePath.startsWith(workspace.outDir)) {
          const pattern = filePath.replace(workspace.outDir, workspace.srcDir).replace(matchExt, defaultExtensions);
          const [srcFilePath] = fastGlob.sync(pattern);
          toSourceMapCache.set(filePath, srcFilePath);
          if (srcFilePath && srcFilePath !== filePath) {
            debugLog('*', `Rewiring ${toRelative(filePath)} → ${toRelative(srcFilePath)}`);
            return srcFilePath;
          }
        }
      }
    }
  };

  return toSourcePath;
};
