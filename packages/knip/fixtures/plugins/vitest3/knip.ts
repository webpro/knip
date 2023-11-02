const config = {
  workspaces: {
    '.': {
      husky: {
        config: ['.husky/pre-commit'],
      },
    },
  },
};

export default config;
