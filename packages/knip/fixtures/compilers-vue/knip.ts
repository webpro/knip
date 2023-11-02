const compiler = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;

export default {
  entry: ['parent.vue'],
  project: '**/*.{ts,vue}',
  compilers: {
    vue: text => {
      const scripts = [];
      let match;
      while ((match = compiler.exec(text))) scripts.push(match[1]);
      return scripts.join(';');
    },
  },
};
