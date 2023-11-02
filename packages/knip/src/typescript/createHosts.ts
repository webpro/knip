import { EOL } from 'node:os';
// eslint-disable-next-line n/no-restricted-import
import path from 'node:path';
import ts from 'typescript';
import { VIRTUAL_FILE_EXTENSIONS } from '../constants.js';
import { createCustomModuleResolver } from './resolveModuleNames.js';
import { SourceFileManager } from './SourceFileManager.js';
import { createCustomSys } from './sys.js';
import type { SyncCompilers, AsyncCompilers } from '../types/compilers.js';

const libLocation = path.dirname(ts.getDefaultLibFilePath({}));

type CreateHostsOptions = {
  cwd: string;
  compilerOptions: ts.CompilerOptions;
  entryPaths: Set<string>;
  compilers: [SyncCompilers, AsyncCompilers];
};

const fileManager = new SourceFileManager();

export const createHosts = ({ cwd, compilerOptions, entryPaths, compilers }: CreateHostsOptions) => {
  fileManager.installCompilers(compilers);
  const virtualFileExtensions = [...VIRTUAL_FILE_EXTENSIONS, ...compilers[0].keys(), ...compilers[1].keys()];
  const sys = createCustomSys(cwd, virtualFileExtensions);
  const resolveModuleNames = createCustomModuleResolver(sys, compilerOptions, virtualFileExtensions);

  const languageServiceHost: ts.LanguageServiceHost = {
    getCompilationSettings: () => compilerOptions,
    getScriptFileNames: () => Array.from(entryPaths),
    getScriptVersion: () => '0',
    getScriptSnapshot: (fileName: string) => fileManager.getSnapshot(fileName),
    getCurrentDirectory: sys.getCurrentDirectory,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    readFile: sys.readFile,
    fileExists: sys.fileExists,
    resolveModuleNames,
  };

  const compilerHost: ts.CompilerHost = {
    writeFile: () => undefined,
    getDefaultLibLocation: () => libLocation,
    getDefaultLibFileName: languageServiceHost.getDefaultLibFileName,
    getSourceFile: (fileName: string) => fileManager.getSourceFile(fileName),
    getCurrentDirectory: languageServiceHost.getCurrentDirectory,
    getCanonicalFileName: (fileName: string) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => EOL,
    readFile: languageServiceHost.readFile,
    fileExists: languageServiceHost.fileExists,
    resolveModuleNames: languageServiceHost.resolveModuleNames,
  };

  return { fileManager, languageServiceHost, compilerHost, resolveModuleNames };
};
