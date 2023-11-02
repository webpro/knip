export default {
  ignore: ['.svelte-kit'],
  paths: {
    '$app/*': ['node_modules/@sveltejs/kit/src/runtime/app/*'],
  },
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
    svelte: (text: string) => [...text.matchAll(/import[^;]+/g)].join('\n'),
  },
};
