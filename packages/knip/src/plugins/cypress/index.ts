import { load, hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.cypress.io/guides/references/configuration

export const NAME = 'Cypress';

/** @public */
export const ENABLERS = ['cypress'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['cypress.config.{js,ts,mjs,cjs}'];

const TEST_FILE_PATTERNS = ['cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'];

const SUPPORT_FILE_PATTERNS = [
  'cypress/support/e2e.{js,jsx,ts,tsx}',
  'cypress/plugins/index.js', // Deprecated since Cypress v10
];

/** @public */
export const ENTRY_FILE_PATTERNS = [...TEST_FILE_PATTERNS, ...SUPPORT_FILE_PATTERNS];

export const findDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  const localConfig = await load(configFilePath);

  if (!localConfig) return [];

  if (config.entry) return config.entry.map(toEntryPattern);

  const patterns = [localConfig.e2e?.specPattern ?? [], localConfig.component?.specPattern ?? []].flat();
  const entryPatterns = (patterns.length > 0 ? patterns : TEST_FILE_PATTERNS).map(toEntryPattern);
  return [...entryPatterns, ...SUPPORT_FILE_PATTERNS.map(toEntryPattern)];
};
