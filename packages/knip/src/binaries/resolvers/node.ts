import parseArgs from 'minimist';
import { compact } from '../../util/array.js';
import { tryResolveFilePath, tryResolveSpecifiers } from '../util.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { cwd }) => {
  const parsed = parseArgs(args, {
    string: ['r'],
    alias: { require: ['r', 'loader', 'experimental-loader', 'test-reporter'] },
  });
  return compact([tryResolveFilePath(cwd, parsed._[0]), ...tryResolveSpecifiers(cwd, [parsed.require].flat())]);
};
