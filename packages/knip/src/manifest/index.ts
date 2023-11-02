import { _getDependenciesFromScripts } from '../binaries/index.js';
import { isDefinitelyTyped } from '../util/modules.js';
import { timerify } from '../util/Performance.js';
import { getPackageManifest } from './helpers.js';
import type { InstalledBinaries, HostDependencies } from '../types/workspace.js';
import type { PackageJson } from '@npmcli/package-json';

type Options = {
  manifest: PackageJson;
  isProduction: boolean;
  isStrict: boolean;
  dir: string;
  cwd: string;
};

const findManifestDependencies = async ({ manifest, isProduction, isStrict, dir, cwd }: Options) => {
  const scriptFilter = isProduction ? ['start', 'postinstall'] : [];
  const hostDependencies: HostDependencies = new Map();

  const scripts = Object.entries(manifest.scripts ?? {}).reduce((scripts, [scriptName, script]) => {
    if (script && (scriptFilter.length === 0 || scriptFilter.includes(scriptName))) {
      scripts.push(script);
    }
    return scripts;
  }, [] as string[]);

  const dependencies = _getDependenciesFromScripts(scripts, { cwd: dir, manifest });

  // Find all binaries for each dependency
  const installedBinaries: InstalledBinaries = new Map();

  const hasTypesIncluded = new Set<string>();

  const packageNames = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...(isStrict ? Object.keys(manifest.peerDependencies ?? {}) : []),
    ...(isProduction ? [] : Object.keys(manifest.devDependencies ?? {})),
  ];

  for (const packageName of packageNames) {
    const manifest = await getPackageManifest({ dir, packageName, cwd });
    if (manifest) {
      // Read and store installed binaries
      const binaryName = packageName.replace(/^@[^/]+\//, '');
      const binaries = typeof manifest.bin === 'string' ? [binaryName] : Object.keys(manifest.bin ?? {});
      binaries.forEach(binaryName => {
        if (installedBinaries.has(binaryName)) {
          installedBinaries.get(binaryName)?.add(packageName);
        } else {
          installedBinaries.set(binaryName, new Set([packageName]));
        }
        if (installedBinaries.has(packageName)) {
          installedBinaries.get(packageName)?.add(binaryName);
        } else {
          installedBinaries.set(packageName, new Set([binaryName]));
        }
      });

      // Read and store peer dependencies
      const packagePeerDependencies = Object.keys(manifest.peerDependencies ?? {});
      packagePeerDependencies.forEach(packagePeerDependency => {
        if (hostDependencies.has(packagePeerDependency)) {
          hostDependencies.get(packagePeerDependency)?.add(packageName);
        } else {
          hostDependencies.set(packagePeerDependency, new Set([packageName]));
        }
      });

      if (!isDefinitelyTyped(packageName) && (manifest.types || manifest.typings)) hasTypesIncluded.add(packageName);
    }
  }

  return {
    dependencies,
    hostDependencies,
    installedBinaries,
    hasTypesIncluded,
  };
};

export const findDependencies = timerify(findManifestDependencies);
