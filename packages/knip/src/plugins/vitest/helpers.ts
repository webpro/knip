import type { ViteConfig } from './types.js';

/**
 * Sources:
 * - https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/integrations/env/index.ts
 * - https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/reporters/index.ts
 */

type BuiltinEnvironment = 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime';
type VitestEnvironment = BuiltinEnvironment | (string & Record<never, never>);

const environments = {
  node: null,
  jsdom: null,
  'happy-dom': null,
  'edge-runtime': null,
};

const envPackageNames: Record<Exclude<keyof typeof environments, 'node'>, string> = {
  jsdom: 'jsdom',
  'happy-dom': 'happy-dom',
  'edge-runtime': '@edge-runtime/vm',
};

export const getEnvPackageName = (env: VitestEnvironment) => {
  if (env === 'node') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (env in envPackageNames) return (envPackageNames as any)[env];
  return `vitest-environment-${env}`;
};

const builtInReporters = ['default', 'verbose', 'dot', 'json', 'tap', 'tap-flat', 'junit', 'hanging-process'];

export const getExternalReporters = (reporters?: ViteConfig['test']['reporters']) =>
  reporters
    ? [reporters].flat().filter(reporter => typeof reporter === 'string' && !builtInReporters.includes(reporter))
    : [];
