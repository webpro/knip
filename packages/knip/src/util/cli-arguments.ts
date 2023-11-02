import { parseArgs } from './parseArgs.js';

export const helpText = `✂️  Find unused files, dependencies and exports in your JavaScript and TypeScript projects

Usage: knip [options]

Options:
  -c, --config [file]      Configuration file path (default: [.]knip.json[c], knip.js, knip.ts or package.json#knip)
  -t, --tsConfig [file]    TypeScript configuration path (default: tsconfig.json)
  --production             Analyze only production source files (e.g. no tests, devDependencies, exported types)
  --strict                 Consider only direct dependencies of workspace (not devDependencies, not other workspaces)
  --ignore-internal        Ignore exports with tag @internal (JSDoc/TSDoc)
  -W, --workspace [dir]    Analyze a single workspace (default: analyze all configured workspaces)
  --directory [dir]        Run process from a different directory (default: cwd)
  --no-gitignore           Don't use .gitignore
  --include                Report only provided issue type(s), can be comma-separated or repeated (1)
  --exclude                Exclude provided issue type(s) from report, can be comma-separated or repeated (1)
  --dependencies           Shortcut for --include dependencies,unlisted,unresolved
  --exports                Shortcut for --include exports,nsExports,classMembers,types,nsTypes,enumMembers,duplicates
  --include-entry-exports  Include entry files when reporting unused exports
  -n, --no-progress        Don't show dynamic progress updates (automatically enabled in CI environments)
  --preprocessor           Preprocess the results before providing it to the reporter(s), can be repeated
  --preprocessor-options   Pass extra options to the preprocessor (as JSON string, see --reporter-options example)
  --reporter               Select reporter: symbols, compact, codeowners, json, jsonExt, can be repeated (default: symbols)
  --reporter-options       Pass extra options to the reporter (as JSON string, see example)
  --no-config-hints        Suppress configuration hints
  --no-exit-code           Always exit with code zero (0)
  --max-issues             Maximum number of issues before non-zero exit code (default: 0)
  -d, --debug              Show debug output
  --debug-file-filter      Filter for files in debug output (regex as string)
  --performance            Measure count and running time of expensive functions and display stats table
  -h, --help               Print this help text
  -V, --version            Print version

(1) Issue types: files, dependencies, unlisted, unresolved, exports, nsExports, classMembers, types, nsTypes, enumMembers, duplicates

Examples:

$ knip
$ knip --production
$ knip --workspace packages/client --include files,dependencies
$ knip -c ./config/knip.json --reporter compact
$ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'
$ knip --debug --debug-file-filter '(specific|particular)-module'

More documentation and bug reports: https://github.com/webpro/knip`;

let parsedArgs;
try {
  parsedArgs = parseArgs({
    options: {
      config: { type: 'string', short: 'c' },
      debug: { type: 'boolean', short: 'd' },
      'debug-file-filter': { type: 'string' },
      dependencies: { type: 'boolean' },
      directory: { type: 'string' },
      exclude: { type: 'string', multiple: true },
      exports: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      'ignore-internal': { type: 'boolean' },
      include: { type: 'string', multiple: true },
      'include-entry-exports': { type: 'boolean' },
      'max-issues': { type: 'string' },
      'no-config-hints': { type: 'boolean' },
      'no-exit-code': { type: 'boolean' },
      'no-gitignore': { type: 'boolean' },
      'no-progress': { type: 'boolean', short: 'n' },
      performance: { type: 'boolean' },
      production: { type: 'boolean' },
      preprocessor: { type: 'string', multiple: true },
      'preprocessor-options': { type: 'string' },
      reporter: { type: 'string', multiple: true },
      'reporter-options': { type: 'string' },
      strict: { type: 'boolean' },
      tsConfig: { type: 'string', short: 't' },
      version: { type: 'boolean', short: 'V' },
      workspace: { type: 'string', short: 'W' },
    },
  });
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
    console.log('\n' + helpText);
    process.exit(1);
  }
  throw error;
}

export default parsedArgs.values;
