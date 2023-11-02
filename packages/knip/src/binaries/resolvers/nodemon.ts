import parseArgs from 'minimist';
import { compact } from '../../util/array.js';
import { toBinary } from '../../util/protocols.js';
import { tryResolveFilePath, tryResolveSpecifiers } from '../util.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { cwd, fromArgs }) => {
  const parsed = parseArgs(args, {
    string: ['r', 'exec'],
    alias: { require: ['r', 'loader', 'experimental-loader', 'test-reporter'] },
  });
  return compact([
    toBinary(binary),
    tryResolveFilePath(cwd, parsed._[0]),
    ...tryResolveSpecifiers(cwd, [parsed.require].flat()),
    ...fromArgs([parsed.exec]),
  ]);
};
