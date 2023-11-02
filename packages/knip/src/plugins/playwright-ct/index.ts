import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import { toEntryPatterns } from '../playwright/index.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';
import type { PlaywrightTestConfig } from 'playwright/test';

// https://playwright.dev/docs/test-components

export const NAME = 'Playwright for components';

/** @public */
export const ENABLERS = [/^@playwright\/experimental-ct-/];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['playwright-ct.config.{js,ts}', 'playwright/index.{js,ts,jsx,tsx}'];

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/*.@(spec|test).?(c|m)[jt]s?(x)'];

const findPlaywrightCTDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { cwd, config } = options;

  const localConfig: PlaywrightTestConfig | undefined = await load(configFilePath);

  if (localConfig) {
    const projects = localConfig.projects ? [localConfig, ...localConfig.projects] : [localConfig];
    const patterns = projects.flatMap(config => toEntryPatterns(config.testMatch, cwd, configFilePath, config));
    if (patterns.length > 0) return patterns;
  }

  return (config?.entry ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);
};

export const findDependencies = timerify(findPlaywrightCTDependencies);
