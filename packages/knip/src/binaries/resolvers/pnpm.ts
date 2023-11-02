import parseArgs from 'minimist';
import { toBinary } from '../../util/protocols.js';
import type { Resolver } from '../types.js';

// https://pnpm.io/cli/add

const commands = [
  'add',
  'audit',
  'bin',
  'config',
  'dedupe',
  'deploy',
  'dlx',
  'doctor',
  'env',
  'fetch',
  'i',
  'import',
  'init',
  'install-test',
  'install',
  'it',
  'licenses',
  'link',
  'list',
  'ln',
  'ls',
  'outdated',
  'outdated',
  'pack',
  'patch-commit',
  'patch-remove',
  'patch',
  'prune',
  'publish',
  'rb',
  'rebuild',
  'remove',
  'rm',
  'root',
  'run',
  'server',
  'setup',
  'start',
  'store',
  't',
  'test',
  'tst',
  'un',
  'uninstall',
  'unlink',
  'up',
  'update',
  'upgrade',
  'why',
];

export const resolve: Resolver = (_binary, args, { manifest }) => {
  const scripts = manifest.scripts ? Object.keys(manifest.scripts) : [];
  const parsed = parseArgs(args, { alias: { recursive: 'r' }, boolean: ['recursive'] });
  const [command, binary] = parsed._;
  if (scripts.includes(command) || commands.includes(command)) return [];
  if (command === 'exec') return [toBinary(binary)];
  return command ? [toBinary(command)] : [];
};
