import { ensurePosixPath } from './glob.js';

export const getPackageNameFromModuleSpecifier = (moduleSpecifier: string) => {
  const parts = moduleSpecifier.split('/').slice(0, 2);
  return moduleSpecifier.startsWith('@') ? parts.join('/') : parts[0];
};

export const getPackageName = (value: string) => {
  const match = ensurePosixPath(value).match(/(?<=node_modules\/)(@[^/]+\/[^/]+|[^/]+)/g);
  if (match) return match[match.length - 1];

  if (value.startsWith('@')) {
    const [scope, packageName] = value.split('/');
    return [scope, packageName].join('/');
  }

  return value.startsWith('/') ? value : value.split('/')[0];
};

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
