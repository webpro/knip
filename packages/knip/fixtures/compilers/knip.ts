module.exports = {
  compilers: {
    md: (text, path) => {
      if (!path)
        throw new Error('Path not passed to compiler')

      return text
    },
    mdx: async (text, path) => {
      if (!path)
        throw new Error('Path not passed to compiler')

      return text
    },
  },
};
