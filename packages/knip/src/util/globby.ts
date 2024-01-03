import * as fs from 'fs';
import { promisify } from 'node:util';
import { walk as _walk } from '@nodelib/fs.walk';
import { type Options as FastGlobOptions } from 'fast-glob';
import fastGlob from 'fast-glob';
import micromatch from 'micromatch';
import { debugLogObject } from './debug.js';
import * as path from './path.js';

const walk = promisify(_walk);
type Options = {
  /** Respect ignore patterns in `.gitignore` files that apply to the globbed files. */
  readonly gitignore?: boolean;

  /** The current working directory in which to search. */
  readonly cwd: string;
} & FastGlobOptionsWithoutCwd;

type FastGlobOptionsWithoutCwd = Pick<FastGlobOptions, 'onlyDirectories' | 'ignore' | 'absolute' | 'dot'>;

/** micromatch and gitignore use slightly different syntax */
function convertGitignoreToMicromatch(pattern: string, base: string) {
  let negated = pattern[0] === '!';
  if (negated) {
    pattern = pattern.slice(1);
  }
  const otherPatterns = [];
  // gitignore matches by basename if no slash present
  if (!pattern.includes('/')) pattern = '**/' + pattern;
  // leading slash on git is equivalent to no leading slash in micromatch
  else if (pattern.startsWith('/')) pattern = pattern.slice(1);
  // micromatch does not interpret dirs as matching their children, git does
  if (pattern.endsWith('/')) otherPatterns.push(pattern + '**');
  else otherPatterns.push(pattern + '/**');
  return { negated, patterns: [pattern, ...otherPatterns].map(pattern => path.join(base, pattern)) };
}

function parseGitignoreFile(filePath: string, cwd: string) {
  const file = fs.readFileSync(filePath, 'utf8');
  const base = path.relative(cwd, path.dirname(filePath));

  return file
    .split(/\r?\n/)
    .filter(line => line && !line.startsWith('#'))
    .map(pattern => convertGitignoreToMicromatch(pattern, base));
}
type Gitignores = { ignores: string[]; unignores: string[] };

/** walks a directory, parsing gitignores and using them directly on the way (early pruning) */
async function parseFindGitignores(options: Options): Promise<Gitignores> {
  const ignores: string[] = [];
  const unignores: string[] = [];
  const consideredFiles: string[] = [];
  await walk(options.cwd, {
    entryFilter: entry => {
      if (entry.dirent.isFile() && entry.name === '.gitignore') {
        consideredFiles.push(entry.path);
        for (const rule of parseGitignoreFile(entry.path, options.cwd))
          if (rule.negated) unignores.push(...rule.patterns);
          else ignores.push(...rule.patterns);
        return true;
      }
      return false;
    },
    deepFilter: entry => !micromatch.any(path.relative(options.cwd, entry.path), ignores, { ignore: unignores }),
  });
  debugLogObject(options.cwd, 'gitignore files', { consideredFiles, ignores, unignores });
  return { ignores, unignores };
}
const cachedIgnores = new Map<string, Gitignores>();

/** load gitignores into memory, with caching */
async function loadGitignores(options: Options): Promise<Gitignores> {
  let gitignore = cachedIgnores.get(options.cwd);
  if (!gitignore) {
    gitignore = await parseFindGitignores(options);
    cachedIgnores.set(options.cwd, gitignore);
  }
  return gitignore;
}
/** simpler and faste replacement for the globby npm library */
export async function globby(patterns: string | string[], options: Options): Promise<string[]> {
  const ignore = options.ignore ?? [];
  if (options.gitignore) {
    const gitignores = await loadGitignores(options);
    ignore.push(...gitignores.ignores);
    ignore.push(...gitignores.unignores.map(e => '!' + e));
  }
  debugLogObject(options.cwd, `fastGlobOptions`, { patterns, ...options, ignore });

  return fastGlob(patterns, {
    ...options,
    ignore,
  });
}

export async function isGitIgnoredFn(options: Options): Promise<(path: string) => boolean> {
  const gitignore = await loadGitignores(options);
  return filePath => {
    const ret = micromatch.any(path.relative(options.cwd, filePath), gitignore.ignores, { ignore: gitignore.unignores });
    // debugLogObject(filePath, 'isGitIgnored', { path: path.relative(options.cwd, filePath), gitignore });
    return ret;
  };
}
