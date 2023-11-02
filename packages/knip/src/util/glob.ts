import fg from 'fast-glob';
import { globby } from 'globby';
import { GLOBAL_IGNORE_PATTERNS, ROOT_WORKSPACE_NAME } from '../constants.js';
import { compact } from './array.js';
import { debugLogObject } from './debug.js';
import { join, relative } from './path.js';
import { timerify } from './Performance.js';

export const prependDirToPattern = (workingDir: string, pattern: string) => {
  if (pattern.startsWith('!')) return '!' + join(workingDir, pattern.slice(1));
  return join(workingDir, pattern);
};

export const negate = (pattern: string) => pattern.replace(/^!?/, '!');
export const hasProductionSuffix = (pattern: string) => pattern.endsWith('!');
export const hasNoProductionSuffix = (pattern: string) => !pattern.endsWith('!');

const removeProductionSuffix = (pattern: string) => pattern.replace(/!$/, '');

const negatedLast = (pattern: string) => (pattern.startsWith('!') ? 1 : -1);

interface BaseGlobOptions {
  cwd: string;
  patterns: string[];
  ignore?: string[];
  gitignore?: boolean;
}

interface GlobOptions extends BaseGlobOptions {
  workingDir?: string;
}

const glob = async ({ cwd, workingDir = cwd, patterns, ignore = [], gitignore = true }: GlobOptions) => {
  if (patterns.length === 0) return [];

  const relativePath = relative(cwd, workingDir);

  // Globbing from root as cwd to include all gitignore files and ignore patterns, so we need to prepend dirs to patterns
  const prepend = (pattern: string) => prependDirToPattern(relativePath, pattern);
  const globPatterns = compact([patterns].flat().map(prepend).map(removeProductionSuffix)).sort(negatedLast);

  // Only negated patterns? Bail out.
  if (globPatterns[0].startsWith('!')) return [];

  const ignorePatterns = compact([...ignore, ...GLOBAL_IGNORE_PATTERNS]);

  debugLogObject(relativePath || ROOT_WORKSPACE_NAME, `Glob options`, { cwd, globPatterns, ignorePatterns });

  return globby(globPatterns, {
    cwd,
    ignore: ignorePatterns,
    gitignore,
    absolute: true,
    dot: true,
  });
};

const pureGlob = async ({ cwd, patterns, ignore = [], gitignore = true }: BaseGlobOptions) => {
  if (patterns.length === 0) return [];
  return globby(patterns, {
    cwd,
    ignore: [...ignore, ...GLOBAL_IGNORE_PATTERNS],
    gitignore,
    absolute: true,
  });
};

const firstGlob = async ({ cwd, patterns }: BaseGlobOptions) => {
  const stream = fg.stream(patterns.map(removeProductionSuffix), { cwd, ignore: GLOBAL_IGNORE_PATTERNS });
  for await (const entry of stream) {
    return entry;
  }
};

const dirGlob = async ({ cwd, patterns }: BaseGlobOptions) =>
  globby(patterns, {
    cwd,
    onlyDirectories: true,
  });

export const _glob = timerify(glob);

export const _pureGlob = timerify(pureGlob);

export const _firstGlob = timerify(firstGlob);

export const _dirGlob = timerify(dirGlob);
