---
title: Compilers
---

Projects may have source files that are not JavaScript or TypeScript, and thus
require compilation (or transpilation, or pre-processing, you name it). Files
like `.mdx`, `.astro`, `.vue` and `.svelte` may also import other sources files
and external dependencies. So ideally, these files are also included when
linting the project. That's why Knip supports compilers.

## Prerequisites

Since compilers are functions, the Knip config must to be in a dynamic `.js` or
`.ts` file.

:::tip[Note]

Compilers will automatically have their extension added as a default extension
to Knip. This means you don't need to add something like `**/*.{ts,astro}` to
the `entry` or `project` file patterns manually. Run Knip in [debug mode][1] for
details.

:::

## Interface

The compiler function interface is straightforward. Text in, text out:

```ts
(source: string) => string;
```

This may also be an `async` function.

:::tip[Note]

Some of the examples below do not use real compilers. The goal is to return a
valid module that can be parsed by the TypeScript compiler to find `import`
statements. However, it's recommended to use real compilers for better results.

:::

## Examples

- [Astro][2]
- [MDX][3]
- [Vue][4]
- [Svelte][5]

### Astro

Use a configuration like this to compile non-standard files in Astro projects:

```ts
import compile from '@mdx-js/mdx'; // Use v1

export default {
  compilers: {
    astro: (text: string) => [...text.matchAll(/import[^;]+/g)].join('\n'),
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
    mdx: (text: string) => compile(text),
  },
};
```

Depending on your project you may not need the `css` and/or `mdx` "compilers".

Knip has an [Astro plugin][6] to save you some configuration. It's enabled
automatically.

### MDX

Here's an example using an actual compiler (`@mdx-js/mdx`):

```ts title="knip.ts"
import compile from '@mdx-js/mdx'; // Use v1

module.exports = {
  entry: ['src/index.ts', '**/*.stories.mdx'],
  compilers: {
    mdx: (text: string) => compile(text),
  },
};
```

### Vue

Here's an example "compiler" for `.vue` files in Vue projects:

```ts title="knip.ts"
const compiler = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;

export default {
  compilers: {
    vue: text => {
      const scripts = [];
      let match;
      while ((match = compiler.exec(text))) scripts.push(match[1]);
      return scripts.join(';');
    },
  },
};
```

This is tested on a project generated using `npm init vue@latest`. Note that
this is not a real compiler, but in many cases it's enough to extract and return
the contents of the `<script>` elements as a TypeScript module.

Knip does not have a Vue plugin, mainly because the entry file `src/main.ts` is
already covered by the default entry patterns. You may need to add e.g.
`src/App.vue` as an entry file.

### Svelte

Use a configuration like this to compile non-standard files in Svelte projects:

```ts title="knip.ts"
import sveltePreprocess from 'svelte-preprocess';
import { preprocess, compile } from 'svelte/compiler';

export default {
  paths: {
    // This ain't pretty, but Svelte basically does the same
    '$app/*': ['node_modules/@sveltejs/kit/src/runtime/app/*'],
    '$env/*': ['.svelte-kit/ambient.d.ts'],
  },
  compilers: {
    // Method 1
    svelte: async (text: string) => {
      const js = await compileSvelteCode(text);
      return js;
    },
    // Method 2 (hacky, but detects type imports)
    svelte: async (text: string) => {
      const js = await compileSvelteCode(text);
      let ts = await extractScriptTS(text);
      // Remove `export` modifiers since these are props, not real exports.
      ts = ts
        .replace(/export let/g, 'let')
        .replace(/export const/g, 'const')
        .replace(/export class/g, 'class')
        .replace(/export function/g, 'function');
      return `${ts}\n${js}`;
    },
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};

const sveltePreprocessor = sveltePreprocess();

/** Compiles a svelte component to pure javascript. Type imports will be discarded. */
async function compileSvelteCode(text: string) {
  const processed = await preprocess(text, sveltePreprocessor, {
    filename: 'dummy.ts',
  });
  const compiled = compile(processed.code);
  return compiled.js.code;
}

/** Returns the typescript code inside the <script> tag. */
async function extractScriptTS(text: string) {
  let ts = '';
  const preprocessor = sveltePreprocess({
    typescript({ content }) {
      ts = content;
      return { code: '' };
    },
  });
  await preprocess(text, preprocessor, { filename: 'dummy.ts' });
  return ts;
}
```

The compiler for `.svelte` files in this example is the actual Svelte compiler,
this is the recommended way whenever available. Knip has a [Svelte plugin][7] to
save you some configuration. It's enabled automatically.

[1]: ../reference/cli.md#--debug
[2]: #astro
[3]: #mdx
[4]: #vue
[5]: #svelte
[6]: ../reference/plugins/astro.md
[7]: ../reference/plugins/svelte.md
