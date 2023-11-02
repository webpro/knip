import '../../src/util/register.js'; // to resolve .ts files
import assert from 'node:assert/strict';
import test from 'node:test';
import { _getDependenciesFromScripts } from '../../src/binaries/index.js';
import { join, resolve } from '../../src/util/path.js';

const cwd = resolve('fixtures/binaries');

const js = join(cwd, 'script.js');
const ts = join(cwd, 'main.ts');
const req = join(cwd, 'require.js');
const index = join(cwd, 'dir', 'index.js');

const pkgScripts = { cwd, manifest: { scripts: { program: '' } } };
const knownOnly = { cwd, knownGlobalsOnly: true };

type T = (script: string | string[], dependencies: string[], options?: { cwd: string }) => void;
const t: T = (script, dependencies = [], options = { cwd }) =>
  assert.deepEqual(_getDependenciesFromScripts(script, options), dependencies);

test('getReferencesFromScripts', () => {
  t('program', ['bin:program']);
  t(['program', 'program'], ['bin:program']);
  t('program -short --long args', ['bin:program']);
  t('program && program2', ['bin:program', 'bin:program2']);
  t('program -x && exec -y -- program2 -z', ['bin:program', 'bin:exec']);
  t('program -x; exec -y -- program2', ['bin:program', 'bin:exec']);
  t('program script.js -- program2', ['bin:program']);
  t("program '*.js' -- program2", ['bin:program']);
  t('program -s .', ['bin:program']);
  t('program command', ['bin:program']);
});

test('getReferencesFromScripts (node)', () => {
  t('node script.js', [js]);
  t('node -r script.js', [js]);
  t('node -r package/script', ['package']);
  t('node -r ./require.js script.js', [js, req]);
  t('node --require=pkg1 --require pkg2 script', [js, 'pkg1', 'pkg2']);
  t('node --loader ts-node/esm node_modules/webpack-cli/bin/cli.js -c ./webpack.config.ts', ['webpack-cli', 'ts-node']);
  t('node --experimental-loader ts-node/esm/transpile-only script.js', [js, 'ts-node']);
  t('node -r @scope/package/register ./dir', [index, '@scope/package']);
  t('node --inspect-brk -r tsconfig-paths/register node_modules/.bin/jest --runInBand', ['bin:jest', 'tsconfig-paths']);
  t('node dist/index.js', []);
  t('./script.js', [js]);
});

test('getReferencesFromScripts (ts-node/tsx)', () => {
  t('ts-node --require pkg/register main.ts', ['bin:ts-node', ts, 'pkg']);
  t('tsx ./main.ts', ['bin:tsx', ts]);
  t('tsx watch ./main.ts', ['bin:tsx', ts]);
  t('node --loader tsx ./main.ts', [ts, 'tsx']);
  t('npx tsx main', ['bin:tsx', ts]);
  t('babel-node --inspect=0.0.0.0 ./main.ts', ['bin:babel-node', ts]);
});

test('getReferencesFromScripts (--require)', () => {
  t('program --loader tsx --test "test/*.spec.ts"', ['bin:program', 'tsx']);
  t('program --loader ldr --loader tsx --test "test/*.spec.ts"', ['bin:program', 'ldr', 'tsx']);
});

test('getReferencesFromScripts (.bin)', () => {
  t('./node_modules/.bin/tsc --noEmit', ['bin:tsc']);
  t('node_modules/.bin/tsc --noEmit', ['bin:tsc']);
  t('$(npm bin)/tsc --noEmit', ['bin:tsc']);
  t('../../../scripts/node_modules/.bin/tsc --noEmit', []);
});

test('getReferencesFromScripts (dotenv)', () => {
  t('dotenv program', ['bin:dotenv', 'bin:program']);
  t('dotenv -- program', ['bin:dotenv', 'bin:program']);
  t('dotenv -e .env3 -v VARIABLE=somevalue -- program', ['bin:dotenv', 'bin:program']);
  t('dotenv -e .env3 -v VARIABLE=somevalue program -- exit', ['bin:dotenv', 'bin:program']);
  t('dotenv -- mvn exec:java -Dexec.args="-g -f"', ['bin:dotenv', 'bin:mvn']);
});

test('getReferencesFromScripts (cross-env)', () => {
  t('cross-env program', ['bin:cross-env', 'bin:program']);
  t('cross-env NODE_ENV=production program', ['bin:cross-env', 'bin:program']);
  t('cross-env NODE_ENV=production program subcommand', ['bin:cross-env', 'bin:program']);
  t('cross-env NODE_OPTIONS=--max-size=3072 program subcommand', ['bin:cross-env', 'bin:program']);
  t('cross-env NODE_ENV=production node -r pkg/config ./script.js', ['bin:cross-env', 'pkg', js]);
  t('NODE_ENV=production cross-env -- program --cache', ['bin:cross-env', 'bin:program']);
});

test('getReferencesFromScripts (nx)', () => {
  t('nx run myapp:build:production', ['bin:nx']);
  t('nx run-many -t build', ['bin:nx']);
  t('nx exec -- esbuild main.ts --outdir=build', ['bin:nx', 'bin:esbuild', ts]);
});

test('getReferencesFromScripts (cross-env/node)', () => {
  t('cross-env NODE_ENV=production node -r node_modules/dotenv/config ./script.js', ['bin:cross-env', 'dotenv', js]);
  t('cross-env NODE_ENV=production node -r esm script.js', ['bin:cross-env', 'esm', js]);
});

test('getReferencesFromScripts (npm)', () => {
  t('npm run script', ['bin:npm']);
  t('npm run publish:latest -- --npm-tag=debug --no-push', ['bin:npm']);
});

test('getReferencesFromScripts (npx)', () => {
  t('npx pkg', ['bin:pkg']);
  t('npx prisma migrate reset --force', ['bin:prisma']);
  t('npx @scope/pkg', ['@scope/pkg']);
  t('npx tsx watch main', ['bin:tsx', ts]);
  t('npx -y pkg', []);
  t('npx --yes pkg', []);
  t('npx --no pkg --edit ${1}', ['bin:pkg']);
  t('npx --no -- pkg --edit ${1}', ['bin:pkg']);
  t('npx pkg install --with-deps', ['bin:pkg']);
  t('npx pkg migrate reset --force', ['bin:pkg']);
  t('npx pkg@1.0.0 migrate reset --force', ['pkg']);
  t('npx @scope/cli migrate reset --force', ['@scope/cli']);
  t('npx -- pkg', ['bin:pkg']);
  t('npx -- @scope/cli@1.0.0 migrate reset --force', ['@scope/cli']);
  t('npx retry-cli@0.6.0 -- curl --output /dev/null ', ['retry-cli', 'bin:curl']);
  t('npx --package pkg@0.6.0 -- curl --output /dev/null', ['bin:curl', 'pkg']);
  t('npx --package @scope/pkg@0.6.0 --package pkg -- curl', ['bin:curl', '@scope/pkg', 'pkg']);
  t("npx --package=foo -c 'curl --output /dev/null'", ['foo', 'bin:curl']);
  t('npx swagger-typescript-api -p http://localhost:3030/swagger.v1.json', ['bin:swagger-typescript-api']);
  t('npx swagger-typescript-api -- -p http://localhost:3030/swagger.v1.json', ['bin:swagger-typescript-api']);
});

test('getReferencesFromScripts (pnpm)', () => {
  t('pnpm exec program', ['bin:program']);
  t('pnpm run program', []);
  t('pnpm program', ['bin:program']);
  t('pnpm run program', [], pkgScripts);
  t('pnpm program', [], pkgScripts);
  t('pnpm dlx pkg', []);
  t('pnpm --package=pkg-a dlx pkg', []);
});

test('getReferencesFromScripts (yarn)', () => {
  t('yarn exec program', ['bin:program']);
  t('yarn run program', ['bin:program']);
  t('yarn program', ['bin:program']);
  t('yarn run program', [], pkgScripts);
  t('yarn program', [], pkgScripts);
  t('yarn dlx pkg', []);
  t('yarn --package=pkg-a -p pkg-b dlx pkg', []);
  t('yarn node script.js', [js]);
});

test('getReferencesFromScripts (rollup)', () => {
  t('rollup --watch --watch.onEnd="node script.js"', ['bin:rollup', js]);
  t('rollup -p ./require.js', ['bin:rollup', req]);
  t('rollup --plugin @rollup/plugin-node-resolve', ['bin:rollup', '@rollup/plugin-node-resolve']);
  t('rollup --configPlugin @rollup/plugin-typescript', ['bin:rollup', '@rollup/plugin-typescript']);
});

test('getReferencesFromScripts (execa)', () => {
  t('execa --quiet script.js', ['bin:execa', js]);
  t('npx --yes execa --quiet script.js', [js]);
});

test('getReferencesFromScripts (zx)', () => {
  t('zx --quiet script.js', ['bin:zx', js]);
  t('npx --yes zx --quiet script.js', [js]);
});

test('getReferencesFromScripts (c8)', () => {
  t('c8 node script.js', ['bin:c8', js]);
  t('c8 npm test', ['bin:c8', 'bin:npm']);
  t('c8 check-coverage --lines 95 --per-file npm test', ['bin:c8', 'bin:npm']);
  t("c8 --reporter=lcov --reporter text mocha 'test/**/*.spec.js'", ['bin:c8', 'bin:mocha']);
  t('c8 --reporter=lcov --reporter text node --test --test-reporter=@org/reporter', ['bin:c8', '@org/reporter']);
});

test('getReferencesFromScripts (nodemon)', () => {
  t('nodemon --require dotenv/config ./script.js --watch ./script.js', ['bin:nodemon', js, 'dotenv']);
  t("nodemon --exec 'ts-node --esm' ./main.ts | pino-pretty", ['bin:nodemon', ts, 'bin:ts-node', 'bin:pino-pretty']);
  t('nodemon script.js', ['bin:nodemon', js]);
});

test('getReferencesFromScripts (fallback resolver)', () => {
  t('adb install -r android/app/app-dev-debug.apk', ['bin:adb']);
});

test('getReferencesFromScripts (bash expressions)', () => {
  t('if test "$NODE_ENV" = "production" ; then make install ; fi ', ['bin:make']);
  t('node -e "if (NODE_ENV === \'production\'){process.exit(1)} " || make install', ['bin:make']);
  t('if ! npx pkg --verbose ; then exit 1 ; fi', ['bin:pkg', 'bin:exit']);
  t('exec < /dev/tty && node_modules/.bin/cz --hook || true', ['bin:exec', 'bin:cz', 'bin:true']);
});

test('getReferencesFromScripts (bash expansion)', () => {
  t('var=$(node ./script.js)', [js]);
  t('var=`node ./script.js`;var=`node ./require.js`', [js, req]);
});

test('getReferencesFromScripts (multiline)', () => {
  t('#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\nnpx lint-staged', ['bin:lint-staged']);
  t(`for S in "s"; do\n\tnpx rc@0.6.0\n\tnpx @scope/rc@0.6.0\ndone`, ['rc', '@scope/rc']);
});

test('getReferencesFromScripts (bail outs)', () => {
  t('curl', [], knownOnly);
  t('program -- mvn exec:java -Dexec.args="-g -f"', [], knownOnly);
  t('deno install --no-check -r -f https://deno.land/x/deploy/deployctl.ts', []);
});

test('getReferencesFromScripts (ignore parse error)', () => {
  t('node --maxWorkers="$(node -e \'process.stdout.write(os.cpus().length.toString())\')"', []); // unclosed '
});
