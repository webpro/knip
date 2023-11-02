import createJITI from 'jiti';
import transform from 'jiti/dist/babel.js';
import { FAKE_PATH } from '../../util/loader.js';
import { timerify } from '../../util/Performance.js';
import type { TransformOptions } from 'jiti/dist/types.js';

const rushstackMatch = /require\(("|')@rushstack\/(eslint-config\/patch|eslint-patch)\/modern-module-resolution("|')\)/;

// @ts-expect-error Our package.json has type=module (for globby, chalk, etc), but here it confuses TypeScript
const jiti = createJITI(process.cwd(), {
  cache: false,
  transform: (opts: TransformOptions) => {
    opts.source = opts.source.replace(rushstackMatch, '');
    // @ts-expect-error Same as above
    return transform(opts);
  },
});

/**
 * Special ESLint config loader to strip problematic lines from source:
 *
 * ```js
 * require('@rushstack/eslint-config/patch/modern-module-resolution');
 * require("@rushstack/eslint-patch/modern-module-resolution");
 * ```
 */
const load = (configFilePath: string) => {
  if (configFilePath === FAKE_PATH) return;
  return jiti(configFilePath);
};

export const fallback = timerify(load);
