import { _glob } from './glob.js';
import { getStringValues } from './object.js';
import { toPosix } from './path.js';
import type { PackageJson } from '@npmcli/package-json';

export const getPackageNameFromModuleSpecifier = (moduleSpecifier: string) => {
  if (!isMaybePackageName(moduleSpecifier)) return;
  const parts = moduleSpecifier.split('/').slice(0, 2);
  return moduleSpecifier.startsWith('@') ? parts.join('/') : parts[0];
};

export const getPackageNameFromFilePath = (value: string) => {
  const match = toPosix(value).match(/(?<=node_modules\/)(@[^/]+\/[^/]+|[^/]+)/g);
  if (match) return match[match.length - 1];
  return value;
};

export const normalizeSpecifierFromFilePath = (value: string) => {
  const match = toPosix(value).match(/.*\/node_modules\/(.+)/);
  if (match) return match[match.length - 1];
  return value;
};

export const isMaybePackageName = (specifier: string) => /^@?[a-z0-9]/.test(specifier);

export const isDefinitelyTyped = (packageName: string) => packageName.startsWith('@types/');

export const getDefinitelyTypedFor = (packageName: string) => {
  if (isDefinitelyTyped(packageName)) return packageName;
  if (packageName.startsWith('@')) return '@types/' + packageName.slice(1).replace('/', '__');
  return '@types/' + packageName;
};

export const getPackageFromDefinitelyTyped = (typedDependency: string) => {
  if (typedDependency.includes('__')) {
    const [scope, packageName] = typedDependency.split('__');
    return `@${scope}/${packageName}`;
  }
  return typedDependency;
};

export const getEntryPathFromManifest = (cwd: string, dir: string, manifest: PackageJson) => {
  const { main, bin, exports } = manifest;

  const entryPaths: Set<string> = new Set();

  if (typeof main === 'string') entryPaths.add(main);

  if (bin) {
    if (typeof bin === 'string') entryPaths.add(bin);
    if (typeof bin === 'object') Object.values(bin).forEach(bin => entryPaths.add(bin));
  }

  if (exports) {
    getStringValues(exports).forEach(item => entryPaths.add(item));
  }

  // Glob, as we only want source files that exist and not (generated) files that are .gitignore'd
  return _glob({ cwd, workingDir: dir, patterns: Array.from(entryPaths) });
};

// Strip `?search` and other proprietary directives from the specifier (e.g. https://webpack.js.org/concepts/loaders/)
export const sanitizeSpecifier = (specifier: string) => specifier.replace(/^([?!|-]+)?([^!?:]+).*/, '$2');
