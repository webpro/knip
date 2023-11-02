import { _getDependenciesFromScripts } from '../../binaries/index.js';
import { getGitHookPaths } from '../../util/git.js';
import { getValuesByKeyDeep } from '../../util/object.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load, loadFile } from '../../util/plugin.js';
import { fromBinary } from '../../util/protocols.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/evilmartians/lefthook

export const NAME = 'Lefthook';

/** @public */
export const ENABLERS = ['lefthook', '@arkweid/lefthook', '@evilmartians/lefthook'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const gitHookPaths = getGitHookPaths();

export const CONFIG_FILE_PATTERNS = ['lefthook.yml', ...gitHookPaths];

const findLefthookDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { cwd, manifest, isProduction } = options;

  if (isProduction) return [];

  const dependencies = manifest.devDependencies ? Object.keys(manifest.devDependencies) : [];

  if (configFilePath.endsWith('.yml')) {
    const localConfig = await load(configFilePath);
    if (!localConfig) return [];
    const scripts = getValuesByKeyDeep(localConfig, 'run').filter((run): run is string => typeof run === 'string');
    const lefthook = process.env.CI ? ENABLERS.filter(dependency => dependencies.includes(dependency)) : [];
    return [...lefthook, ..._getDependenciesFromScripts(scripts, { cwd, manifest, knownGlobalsOnly: true })];
  }

  const script = await loadFile(configFilePath);

  if (!script) return [];

  const scriptDependencies = _getDependenciesFromScripts([script], { cwd, manifest, knownGlobalsOnly: false });
  const matches = scriptDependencies.find(dep => dependencies.includes(fromBinary(dep)));
  return matches ? [matches] : [];
};

export const findDependencies = timerify(findLefthookDependencies);
