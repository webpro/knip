import parseArgs from 'minimist';
import { isInternal } from '../../util/path.js';
import { toBinary } from '../../util/protocols.js';
import { getBinariesFromScript } from '../bash-parser.js';
import { argsFrom, stripVersionFromSpecifier } from '../util.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { cwd, fromArgs, manifest }) => {
  const parsed = parseArgs(args, {
    boolean: ['yes', 'no'],
    alias: { yes: 'y', no: 'no-install', package: 'p', call: 'c' },
  });

  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';

  const packages = parsed.package ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = parsed.call ? getBinariesFromScript(parsed.call, { cwd, manifest }) : [];
  const restArgs = argsFrom(args, packageSpecifier);

  const dependencies = manifest ? Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }) : [];
  const isBinary =
    specifier && !packageSpecifier.includes('@') && !isInternal(specifier) && !dependencies.includes(specifier);
  const dependency = isBinary ? toBinary(specifier) : specifier;
  const specifiers = dependency && !parsed.yes ? [dependency] : [];

  return [...specifiers, ...packages, ...command, ...fromArgs(restArgs).slice(1)];
};
