let parseArgs: typeof import('node:util').parseArgs;
if (process.versions.bun) {
  // @ts-expect-error Almost compatible, let's use the built-in types
  parseArgs = (await import('@pkgjs/parseargs')).parseArgs;
} else {
  parseArgs = (await import('node:util')).parseArgs;
}
export { parseArgs };
