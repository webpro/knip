import { join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { findTypeScriptDependencies } from '../typescript/index.js';
import type { AngularCLIWorkspaceConfiguration } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://angular.io/guide/workspace-config

export const NAME = 'Angular';

/** @public */
export const ENABLERS = ['@angular/cli'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['angular.json'];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { cwd } = options;

  const localConfig: AngularCLIWorkspaceConfiguration | undefined = await load(configFilePath);

  if (!localConfig?.projects) return [];

  const dependencies = new Set<string>();

  for (const project of Object.values(localConfig.projects)) {
    if (!project.architect) return [];
    for (const target of Object.values(project.architect)) {
      const { options: opts } = target;
      const [packageName] = typeof target.builder === 'string' ? target.builder.split(':') : [];
      if (typeof packageName === 'string') dependencies.add(packageName);
      if (opts) {
        if ('main' in opts && typeof opts.main === 'string') {
          dependencies.add(join(cwd, opts.main));
        }
        if ('tsConfig' in opts && typeof opts.tsConfig === 'string') {
          const tsConfigDependencies = await findTypeScriptDependencies(join(cwd, opts.tsConfig), options);
          tsConfigDependencies.forEach(dependency => dependencies.add(dependency));
        }
      }
    }
  }

  return Array.from(dependencies);
};

export const findDependencies = timerify(findPluginDependencies);
