import { existsSync } from 'node:fs';
import ts from 'typescript';
import { sanitizeSpecifier } from '../util/modules.js';
import { dirname, extname, isAbsolute, isInternal, join } from '../util/path.js';
import { isDeclarationFileExtension } from './ast-helpers.js';
import { ensureRealFilePath, isVirtualFilePath } from './utils.js';

const simpleResolver = (name: string, containingFile: string) => {
  const resolvedFileName = isAbsolute(name) ? name : join(dirname(containingFile), name);
  if (existsSync(resolvedFileName)) {
    return {
      resolvedFileName,
      extension: extname(resolvedFileName),
      isExternalLibraryImport: false,
      resolvedUsingTsExtension: false,
    };
  }
};

export function createCustomModuleResolver(
  customSys: typeof ts.sys,
  compilerOptions: ts.CompilerOptions,
  virtualFileExtensions: string[]
) {
  function resolveModuleNames(moduleNames: string[], containingFile: string): Array<ts.ResolvedModule | undefined> {
    return moduleNames.map(moduleName => resolveModuleName(moduleName, containingFile));
  }

  function resolveModuleName(name: string, containingFile: string): ts.ResolvedModule | undefined {
    const sanitizedSpecifier = sanitizeSpecifier(name);

    const tsResolvedModule = ts.resolveModuleName(
      sanitizedSpecifier,
      containingFile,
      compilerOptions,
      ts.sys
    ).resolvedModule;

    // When TS does not resolve it, and it's not a registered virtual file ext, try `fs.existsSync`
    if (!tsResolvedModule) {
      const extension = extname(sanitizedSpecifier);
      if (extension && isInternal(sanitizedSpecifier) && !virtualFileExtensions.includes(extension)) {
        const module = simpleResolver(sanitizedSpecifier, containingFile);
        if (module) return module;
      }
    }

    // This turns resolved local `.d.ts` filenames into `.js` (if specifier has the extension and file exists),
    // because there can be both module.d.ts and module.js and we want the latter.
    if (
      tsResolvedModule &&
      isDeclarationFileExtension(tsResolvedModule?.extension) &&
      isInternal(tsResolvedModule.resolvedFileName)
    ) {
      const module = simpleResolver(sanitizedSpecifier, containingFile);
      if (module) return module;
    }

    if (virtualFileExtensions.length === 0) return tsResolvedModule;

    if (tsResolvedModule && !isVirtualFilePath(tsResolvedModule.resolvedFileName, virtualFileExtensions)) {
      return tsResolvedModule;
    }

    const customResolvedModule = ts.resolveModuleName(name, containingFile, compilerOptions, customSys).resolvedModule;

    if (!customResolvedModule || !isVirtualFilePath(customResolvedModule.resolvedFileName, virtualFileExtensions)) {
      return customResolvedModule;
    }

    const resolvedFileName = ensureRealFilePath(customResolvedModule.resolvedFileName, virtualFileExtensions);

    const resolvedModule: ts.ResolvedModuleFull = {
      extension: ts.Extension.Js,
      resolvedFileName,
      isExternalLibraryImport: customResolvedModule.isExternalLibraryImport,
    };

    return resolvedModule;
  }

  return resolveModuleNames;
}
