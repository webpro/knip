import ts from 'typescript';
import { ProjectPrincipal } from './ProjectPrincipal.js';
import { toAbsolute } from './util/path.js';
import type { SyncCompilers, AsyncCompilers } from './types/compilers.js';

type Paths = ts.CompilerOptions['paths'];

type Principal = { principal: ProjectPrincipal; cwds: Set<string>; pathKeys: Set<string>; pkgNames: Set<string> };
type Principals = Set<Principal>;

type Options = {
  cwd: string;
  compilerOptions: ts.CompilerOptions;
  paths: Paths;
  compilers: [SyncCompilers, AsyncCompilers];
  pkgName: string;
};

const mergePaths = (cwd: string, compilerOptions: ts.CompilerOptions, paths: Paths = {}) => {
  const overridePaths = Object.keys(paths).reduce((overridePaths, key) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    overridePaths![key] = paths[key].map(entry => toAbsolute(entry, cwd));
    return overridePaths;
  }, {} as Paths);
  compilerOptions.paths = { ...compilerOptions.paths, ...overridePaths };
  return compilerOptions;
};

/**
 * The principal factory hands out ProjectPrincipals. It tries to reuse them, since they're expensive in terms of
 * performance. Time will tell if this is actually feasible or not.
 */
export class PrincipalFactory {
  principals: Principals = new Set();

  public getPrincipal(options: Options) {
    const { cwd, compilerOptions, paths, pkgName } = options;
    options.compilerOptions = mergePaths(cwd, compilerOptions, paths);
    const principal = this.findReusablePrincipal(compilerOptions);
    if (principal) {
      this.linkPrincipal(principal, cwd, compilerOptions, pkgName);
      return principal.principal;
    } else {
      return this.addNewPrincipal(options);
    }
  }

  /**
   * Principals with shared `compilerOptions.baseUrl` and no `compilerOptions.paths` conflicts are reused.
   */
  private findReusablePrincipal(compilerOptions: ts.CompilerOptions) {
    const workspacePaths = compilerOptions?.paths ? Object.keys(compilerOptions.paths) : [];
    const principal = Array.from(this.principals).find(principal => {
      if (compilerOptions.pathsBasePath && principal.principal.compilerOptions.pathsBasePath) return false;
      if (compilerOptions.baseUrl === principal.principal.compilerOptions.baseUrl) {
        return workspacePaths.every(p => !principal.pathKeys.has(p));
      }
      return !compilerOptions.baseUrl;
    });
    return principal;
  }

  private linkPrincipal(principal: Principal, cwd: string, compilerOptions: ts.CompilerOptions, pkgName: string) {
    const { pathsBasePath, paths } = compilerOptions;
    if (pathsBasePath) principal.principal.compilerOptions.pathsBasePath = pathsBasePath;
    Object.keys(paths ?? {}).forEach(p => principal.pathKeys.add(p));
    principal.principal.compilerOptions.paths = { ...principal.principal.compilerOptions.paths, ...paths };
    principal.cwds.add(cwd);
    principal.pkgNames.add(pkgName);
  }

  private addNewPrincipal(options: Options) {
    const { cwd, compilerOptions, pkgName } = options;
    const pathKeys = new Set(Object.keys(compilerOptions?.paths ?? {}));
    const principal = new ProjectPrincipal(options);
    this.principals.add({ principal, cwds: new Set([cwd]), pathKeys, pkgNames: new Set([pkgName]) });
    return principal;
  }

  public getPrincipals() {
    return Array.from(this.principals, p => p.principal).reverse();
  }

  public getPrincipalByPackageName(packageName: string) {
    return Array.from(this.principals).find(principal => principal.pkgNames.has(packageName))?.principal;
  }
}
