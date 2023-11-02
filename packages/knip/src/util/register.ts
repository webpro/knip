import module from 'node:module';
import createJITI from 'jiti';
import { IGNORED_FILE_EXTENSIONS, DEFAULT_EXTENSIONS } from '../constants.js';

// @ts-expect-error Undocumented and not typed (hacky, but common practice)
const _extensions = module.Module._extensions;

// @ts-expect-error Our package.json has type=module (for globby, chalk, etc), but here it confuses TypeScript
export const jiti = createJITI(process.cwd(), { interopDefault: true, extensions: DEFAULT_EXTENSIONS });

// Do not register when `--loader tsx` is already installed for tests
if (!('.ts' in _extensions)) {
  jiti.register();
}

/**
 * When loading foreign JS/TS from plugins (using `_load`), non-JS things like .svg or .css files might be imported.
 * For instance, in Storybook configuration through Webpack loaders. So here we install dummy extension handlers.
 *
 * Also see:
 * - https://github.com/nodejs/node/blob/main/lib/internal/modules/cjs/loader.js
 * - https://github.com/danez/pirates/blob/main/src/index.js
 */

// @ts-expect-error No type definition available for the `module argument` (it's CommonJS and not TypeScript)
const exportFilePath = (module, filePath: string) => {
  /** @public */
  module.exports = filePath;
};

IGNORED_FILE_EXTENSIONS.forEach(ext => {
  _extensions[ext] = exportFilePath;
});
