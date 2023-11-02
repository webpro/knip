import { fileURLToPath } from 'node:url';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import jsx from 'acorn-jsx';

export default {
  input: 'main.js',
  external: [
    'some-externally-required-library',
    fileURLToPath(new URL('do-not-bundle.js', import.meta.url)),
    /node_modules/,
  ],
  plugins: [resolve(), commonjs()],
  acornInjectPlugins: [jsx()],
  output: [
    {
      file: 'bundle.js',
      format: 'es',
    },
    {
      file: 'bundle.min.js',
      format: 'es',
      plugins: [terser()],
    },
  ],
};
