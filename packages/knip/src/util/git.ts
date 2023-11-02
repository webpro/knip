import { execSync } from 'child_process';
import { join } from './path.js';

// TODO More hooks exists, but is it worth adding all of them?
const hookFileNames = [
  `prepare-commit-msg`,
  `commit-msg`,
  `pre-{applypatch,commit,merge-commit,push,rebase,receive}`,
  `post-{checkout,commit,merge,rewrite}`,
];

const getGitHooksPath = (defaultPath = '.git/hooks') => {
  try {
    return execSync('git config --get core.hooksPath', { encoding: 'utf8' }).trim();
  } catch (error) {
    return defaultPath;
  }
};

export const getGitHookPaths = (defaultPath = '.git/hooks') => {
  const gitHooksPath = getGitHooksPath(defaultPath);
  return hookFileNames.map(fileName => join(gitHooksPath, fileName));
};
