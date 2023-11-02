import parseArgs from 'minimist';
import { toBinary } from '../../util/protocols.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { fromArgs }) => {
  const parsed = parseArgs(args);
  const [command] = parsed._;
  if (command === 'exec') return [toBinary(binary), ...fromArgs(parsed._.slice(1))];
  return [toBinary(binary)];
};
